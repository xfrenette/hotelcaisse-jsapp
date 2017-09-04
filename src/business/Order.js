import { identifier, list, object, serializable } from 'serializr';
import { computed, isObservableArray, observable } from 'mobx';
import postal from 'postal';
import EventEmitter from 'events';
import Decimal from 'decimal.js';
import arrayDifference from 'lodash.difference';
import { timestamp } from '../vendor/serializr/propSchemas';
import { CHANNELS, TOPICS } from '../const/message-bus';
import OrderChanges from './OrderChanges';
import Item from './Item';
import Credit from './Credit';
import Transaction from './Transaction';
import RoomSelection from './RoomSelection';
import Customer from './Customer';

/**
 * All messages by this class are published on the same channel.
 *
 * @type {ChannelDefinition}
 */
const channel = postal.channel(CHANNELS.order);

/**
 * An Order, associated with a Customer, contains a list of Items sold (or refunded), a list of
 * Credits, a list of Transactions (payments or refunds) and a list of RoomSelections.
 *
 * We wish the Order to send a message when it is modified. But since the desired new Order may
 * require multiple changes (ex: 2 new items, 1 new payment mode, 1 new credit, all done one at a
 * time), it could clutter the system if a message had to be processed for each modifications. To
 * fix this, the Order comes with a 'modifications transaction' feature: you start recording
 * changes by calling recordChanges(), you modify the Order as you want and then you call commit()
 * when finished. This will publish a 'commit' message containing only the changes that were made.
 * This system also allows for a revert() method that can cancel all the modifications.
 */
class Order extends EventEmitter {
	/**
	 * UUID of the register
	 *
	 * @type {String}
	 */
	@serializable(identifier())
	uuid = null;
	/**
	 * Creation date time.
	 *
	 * @type {Date}
	 */
	@serializable(timestamp())
	createdAt = null;
	/**
	 * List of Items.
	 *
	 * @type {Array<Item>}
	 */
	@observable
	@serializable(list(object(Item)))
	items = [];
	/**
	 * List of Credits.
	 *
	 * @type {Array<Credit>}
	 */
	@observable
	@serializable(list(object(Credit)))
	credits = [];
	/**
	 * List of Transactions.
	 *
	 * @type {Array<Transaction>}
	 */
	@observable
	@serializable(list(object(Transaction)))
	transactions = [];
	/**
	 * List of RoomSelection
	 *
	 * @type {Array<RoomSelection>}
	 */
	@observable
	@serializable(list(object(RoomSelection)))
	roomSelections = [];
	/**
	 * Optional note.
	 *
	 * @type {String}
	 */
	@observable
	@serializable
	note = '';
	/**
	 * Customer of the Order.
	 *
	 * @type {Customer}
	 */
	@serializable(object(Customer))
	customer = new Customer();
	/**
	 * Flag indicating if currently recording changes.
	 *
	 * @type {Boolean}
	 */
	recordingChanges = false;
	/**
	 * When recording changes, this object holds the state of the Order when recording started. If we
	 * call revertChanges(), the Order will be reverted to those data.
	 *
	 * @type {Object}
	 */
	restorationData = null;
	/**
	 * Localizer used to round currency. It is not required, but, if set, amounts for taxesTotal and
	 * all attributes using it (balance, total, ...) will be rounded to the number of decimals of
	 * the currency.
	 *
	 * @type {Localizer}
	 */
	localizer = null;

	constructor(uuid = null) {
		super();
		this.createdAt = new Date();
		this.uuid = uuid;
	}

	/**
	 * Returns the total of the items' subtotal (which is before taxes).
	 *
	 * @return {Decimal}
	 */
	@computed
	get itemsSubtotal() {
		return this.items.reduce(
			(sum, item) => sum.add(item.subtotal),
			new Decimal(0)
		);
	}

	/**
	 * Returns an array of AppliedTax totals of the items. Taxes with the same taxId are added.
	 * The amounts are rounded to the number of decimals of the currency, if a currency is set.
	 *
	 * @return {Array<AppliedTax>}
	 */
	@computed
	get taxesTotals() {
		const taxes = this.calculateRawTaxesTotals();
		if (!this.localizer) {
			return taxes;
		}

		taxes.forEach((tax) => {
			const newAmount = this.localizer.roundForCurrency(tax.amount.toNumber());
			tax.amount = new Decimal(newAmount);
		});

		return taxes;
	}

	/**
	 * Internal function that returns the taxes without any rounding. Used by taxesTotal
	 * @return {Array<AppliedTax>}
	 */
	calculateRawTaxesTotals() {
		// We construct a temporary object that is the sum of each tax. The object will have this
		// shape:
		// {
		// 	<taxId> : <AppliedTax>
		// 	...
		// }
		const totals = this.items.reduce(
			(prevTotal, item) => {
				item.taxesTotals.forEach((tax) => {
					if (prevTotal[tax.taxId]) {
						const current = prevTotal[tax.taxId];
						current.amount = current.amount.add(tax.amount);
					} else {
						prevTotal[tax.taxId] = tax.clone();
					}
				});

				return prevTotal;
			},
			{}
		);

		// From the totals object, we return an array of AppliedTax:
		return Object.values(totals);
	}

	/**
	 * Returns sum of the items' total. If a localizer is set, it will be rounded to the
	 * currency's decimal places
	 *
	 * @return {Decimal}
	 */
	@computed
	get itemsTotal() {
		let total = this.items.reduce(
			(sum, item) => sum.add(item.total),
			new Decimal(0)
		);

		if (this.localizer) {
			total = new Decimal(this.localizer.roundForCurrency(total.toNumber()));
		}

		return total;
	}

	/**
	 * Returns sum of transactions amount (payments and refunds)
	 *
	 * @return {Decimal}
	 */
	@computed
	get transactionsTotal() {
		return this.transactions.reduce(
			(prevSum, transaction) => prevSum.add(transaction.amount),
			new Decimal(0)
		);
	}

	/**
	 * Returns sum of the credits amount.
	 *
	 * @return {Decimal}
	 */
	@computed
	get creditsTotal() {
		return this.credits.reduce(
			(prevSum, credit) => (
				credit.amount === null ? prevSum : prevSum.add(credit.amount)
			),
			new Decimal(0)
		);
	}

	/**
	 * Returns total price of the order, a.k.a. amount of the order.
	 *
	 * itemsSubTotal() + taxesTotal() - creditsTotal()
	 *
	 * @return {Decimal}
	 */
	@computed
	get total() {
		const taxesTotal = this.taxesTotals.reduce(
			(prev, tax) => prev.add(tax.amount),
			new Decimal(0)
		);
		return this.itemsSubtotal
			.add(taxesTotal)
			.sub(this.creditsTotal);
	}

	/**
	 * Returns the total amount left to pay by (or to refund to, if negative) the customer for this
	 * order.
	 *
	 * total() - transactionsTotal()
	 *
	 * @return {Decimal}
	 */
	@computed
	get balance() {
		return this.total.sub(this.transactionsTotal);
	}

	/**
	 * Returns, in the roomSelections, the earliest "check in" date (which correspond to the earliest
	 * startDate of all the roomSelections). If no roomSelections, or if their startDate is not set,
	 * returns null.
	 *
	 * @return {Date}
	 */
	@computed
	get earliestCheckInDate() {
		return this.roomSelections.reduce((earliest, roomSelection) => {
			const startDate = roomSelection.startDate;

			if (startDate === null) {
				return earliest;
			}

			if (earliest === null) {
				return startDate;
			}

			if (startDate.getTime() < earliest.getTime()) {
				return startDate;
			}

			return earliest;
		}, null);
	}

	/**
	 * Returns, in the roomSelections, the latest "check out" date (which correspond to the latest
	 * endDate of all the roomSelections). If no roomSelections, or if their endDate is not set,
	 * returns null.
	 *
	 * @return {Date}
	 */
	@computed
	get latestCheckOutDate() {
		return this.roomSelections.reduce((latest, roomSelection) => {
			const endDate = roomSelection.endDate;

			if (endDate === null) {
				return latest;
			}

			if (latest === null) {
				return endDate;
			}

			if (endDate.getTime() > latest.getTime()) {
				return endDate;
			}

			return latest;
		}, null);
	}

	/**
	 * Removes an item using its uuid.
	 *
	 * @param {Item} item
	 */
	removeItem(item) {
		const filteredItems = this.items.filter(currItem => currItem.uuid !== item.uuid);
		this.items.replace(filteredItems);
	}

	/**
	 * Removes a credit using its uuid.
	 *
	 * @param {Credit} credit
	 */
	removeCredit(credit) {
		const filteredCredits = this.credits.filter(currCredit => currCredit.uuid !== credit.uuid);
		this.credits.replace(filteredCredits);
	}

	/**
	 * Removes a transaction using its uuid.
	 *
	 * @param {Transaction} transaction
	 */
	removeTransaction(transaction) {
		const filteredTransactions = this.transactions.filter(
			currTransaction => currTransaction.uuid !== transaction.uuid
		);
		this.transactions.replace(filteredTransactions);
	}

	/**
	 * Removes a RoomSelection using its uuid.
	 *
	 * @param {RoomSelection} roomSelection
	 */
	removeRoomSelection(roomSelection) {
		const filteredRoomSelections = this.roomSelections.filter(
			currRoomSelection => currRoomSelection.uuid !== roomSelection.uuid
		);
		this.roomSelections.replace(filteredRoomSelections);
	}

	/**
	 * Starts recording all changes to the Order.
	 */
	recordChanges() {
		if (this.recordingChanges) {
			return;
		}

		this.recordingChanges = true;
		this.restorationData = this.createRestorationData();
	}

	/**
	 * Stops recording changes and publishes a message containing the changes.
	 */
	commitChanges() {
		const changes = this.getChanges();
		this.stopRecordChanges();

		if (changes !== null) {
			this.emit('change', changes);

			channel.publish(TOPICS.order.modified, {
				changes,
				order: this,
			});
		}
	}

	/**
	 * Stops recording changes and restores this Order to the data at the time of recordChanges().
	 */
	revertChanges() {
		const restorationData = this.restorationData;
		this.stopRecordChanges();
		this.restoreFrom(restorationData);
	}

	/**
	 * Stops recording changes and clears list of changes recorded.
	 */
	stopRecordChanges() {
		this.recordingChanges = false;
		this.restorationData = null;
	}

	/**
	 * Restore the values of this Order with data in restorationData.
	 *
	 * @param {Object} restorationData
	 */
	restoreFrom(restorationData) {
		if (restorationData === null || typeof restorationData !== 'object') {
			return;
		}

		const fields = ['note', 'items', 'credits', 'transactions', 'roomSelections'];
		fields.forEach((field) => {
			if (restorationData[field]) {
				if (isObservableArray(this[field])) {
					this[field].replace(restorationData[field]);
				} else {
					this[field] = restorationData[field];
				}
			}
		});

		if (restorationData.customer) {
			this.customer = restorationData.customer;
		}
	}

	/**
	 * Creates an object of restoration data of the current state of the Order.
	 *
	 * Once an Order is created, the following fields can have new elements, but their existing
	 * elements cannot be changed or removed. This is why we only create a shallow copy :
	 * - items
	 * - transactions
	 *
	 * But the following fields can be changed, so we create a deep copy :
	 * - note (string, so deep copy is not applicable)
	 * - customer
	 * - roomSelections
	 * - credits
	 *
	 * @return {Object}
	 */
	createRestorationData() {
		return {
			note: this.note,
			items: this.items.slice(),
			transactions: this.transactions.slice(),
			credits: this.credits.map(credit => credit.clone()),
			customer: this.customer.clone(),
			roomSelections: this.roomSelections.map(roomSelection => roomSelection.clone()),
		};
	}

	/**
	 * Returns a OrderChanges containing changes between the current properties of the Order and the
	 * ones in the restoration data that were set by recordChanges().
	 *
	 * `items` and `transactions`: the application only allows to add, we cannot delete or
	 * modify existing elements once it is saved, so the returned changes will contain only new
	 * elements, if any.
	 *
	 * `roomSelections` and `credits`: it is allowed to add, delete and change elements. If any
	 * of those change occured, *all* elements will be returned, without the ones deleted, but
	 * with the ones that changed or not.
	 *
	 * `customer`: if any fieldValue changed, the whole Customer object is in the changes.
	 *
	 * @return {OrderChanges}
	 */
	getChanges() {
		if (this.restorationData === null || typeof this.restorationData !== 'object') {
			return null;
		}

		const old = this.restorationData;
		const changes = new OrderChanges();

		if (this.note !== old.note) {
			changes.setField('note', this.note);
		}

		['items', 'transactions'].forEach((field) => {
			const diff = arrayDifference(this[field], old[field]);
			if (diff.length) {
				changes.setField(field, diff);
			}
		});

		if (!this.customer.equals(old.customer)) {
			changes.setField('customer', this.customer.clone());
		}

		if (this.didRoomSelectionsChanged(old)) {
			changes.setField(
				'roomSelections',
				this.roomSelections.map(roomSelection => roomSelection.clone())
			);
		}

		if (this.didCreditsChanged(old)) {
			changes.setField('credits', this.credits.map(credit => credit.clone()));
		}

		return changes;
	}

	/**
	 * Compares the current roomSelections with the ones in 'old'. If any change is detected,
	 * returns true.
	 *
	 * @param {object} old
	 * @return {boolean}
	 */
	didRoomSelectionsChanged(old) {
		if (old.roomSelections.length !== this.roomSelections.length) {
			return true;
		}

		const changed = this.roomSelections.find(
			(roomSelection, index) => !roomSelection.equals(old.roomSelections[index])
		);

		return !!changed;
	}

	/**
	 * Compares the current credits with the ones in 'old'. If any change is detected, returns true.
	 *
	 * @param {object} old
	 * @return {boolean}
	 */
	didCreditsChanged(old) {
		if (old.credits.length !== this.credits.length) {
			return true;
		}

		const changed = this.credits.find(
			(credit, index) => !credit.equals(old.credits[index])
		);

		return !!changed;
	}

	/**
	 * Removes "empty" elements (empty items and empty credits)
	 */
	trim() {
		this.trimItems();
		this.trimCredits();
	}

	/**
	 * Removes "empty" items : if their quantity is 0 or if their product is "empty" (no name and no
	 * price)
	 */
	trimItems() {
		const items = [...this.items];
		items.forEach((item) => {
			if (item.quantity === 0) {
				this.removeItem(item);
				return;
			}

			const product = item.product;
			if (product.name === null && product.price === null) {
				this.removeItem(item);
			}
		});
	}

	/**
	 * Removes "empty" credits : if their amount is 0 or if they have no note and no amount.
	 */
	trimCredits() {
		const credits = [...this.credits];
		credits.forEach((credit) => {
			let doRemove = false;

			if (credit.amount === null || credit.amount.eq(0)) {
				doRemove = true;
			}

			if (credit.note === null && credit.amount === null) {
				doRemove = true;
			}

			if (doRemove) {
				this.removeCredit(credit);
			}
		});
	}

	/**
	 * Freezes the order by freezing all its elements that can be frozen.
	 */
	freeze() {
		this.items.forEach((item) => { item.freeze(); });
		this.roomSelections.forEach((roomSelection) => { roomSelection.freeze(); });
		this.transactions.forEach((transaction) => { transaction.freeze(); });
	}

	/**
	 * The Order validates its own attributes, as specified in the attributes property. If all
	 * are attributes valid, returns undefined, else returns an object where the keys are the invalid
	 * attributes.
	 *
	 * The following attributes can be validates :
	 * - items (validates that all items are themselves valid)
	 * - credits (validates that all credits are themselves valid)
	 *
	 * @param {Array} rawAttributes
	 * @return {Object}
	 */
	validate(rawAttributes = null) {
		let valid = true;
		let res = {};
		const attributesValidationMethods = {
			items: () => this.validateItems(),
			credits: () => this.validateCredits(),
			customer: () => this.validateCustomer(),
			roomSelections: () => this.validateRoomSelections(),
		};
		const attributes = rawAttributes || Object.keys(attributesValidationMethods);

		attributes.forEach((attribute) => {
			const validationMethod = attributesValidationMethods[attribute];
			if (!validationMethod) {
				return;
			}
			const attributeRes = validationMethod();
			if (attributeRes) {
				valid = false;
				res = { ...res, ...attributeRes };
			}
		});

		return valid ? undefined : res;
	}

	/**
	 * Validates the items. See validate()
	 *
	 * @return {Object}
	 */
	validateItems() {
		let res;

		this.items.find((item) => {
			if (item.validate()) {
				res = { items: ['An item is invalid'] };
				return true;
			}

			return false;
		});

		// noinspection JSUnusedAssignment
		return res;
	}

	/**
	 * Validates the credits. See validate()
	 *
	 * @return {Object}
	 */
	validateCredits() {
		let res;

		this.credits.find((credit) => {
			if (credit.validate()) {
				res = { credits: ['A credit is invalid'] };
				return true;
			}

			return false;
		});

		// noinspection JSUnusedAssignment
		return res;
	}

	/**
	 * Validates the Customer (a Customer must be present and valid). See validate()
	 *
	 * @return {Object}
	 */
	validateCustomer() {
		if (!this.customer) {
			return { customer: ['A Customer is required'] };
		}

		const res = this.customer.validate();

		if (res) {
			return { customer: ['A Customer field is in error'] };
		}

		return undefined;
	}

	/**
	 * Validates the roomSelections (each must be valid). See validate()
	 *
	 * @return {Object}
	 */
	validateRoomSelections() {
		let valid = true;
		const res = {};

		this.roomSelections.find((roomSelection) => {
			if (roomSelection.validate()) {
				valid = false;
				res.roomSelections = ['A roomSelection is not valid'];
				return true;
			}

			return false;
		});

		return valid ? undefined : res;
	}
}

export default Order;
