import { serializable, list, date, object, identifier } from 'serializr';
import { observable, computed, isObservableArray } from 'mobx';
import postal from 'postal';
import Decimal from 'decimal.js';
import arrayDifference from 'lodash.difference';
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
 * An Order, associated with a Customer, contains a list of Items sold (or reimbursed), a list of
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
class Order {
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
	@serializable(date())
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
	@serializable
	note = '';
	/**
	 * Customer of the Order.
	 *
	 * @type {Customer}
	 */
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

	constructor(uuid = null) {
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
	 * Returns an array of tax totals of the items. Taxes with the same name are added.
	 * Each element is an object:
	 *
	 * {name:<String>, amount:<Decimal>},
	 *
	 * @return {Array}
	 */
	@computed
	get taxesTotals() {
		// We construct a temporary object that is the sum of each tax. The object will have this
		// shape:
		// {
		// 	<taxName> : <amount>
		// 	...
		// }
		const totals = this.items.reduce(
			(prevTotal, item) => {
				item.taxesTotals.forEach((tax) => {
					const amount = prevTotal[tax.name]
						? prevTotal[tax.name].add(tax.amount)
						: tax.amount;

					prevTotal[tax.name] = amount;
				});

				return prevTotal;
			},
			{}
		);

		// From the totals object, we return an array of this shape:
		// [
		// 	{name: <taxName>, amount: <amount>},
		// 	...
		// ]
		return Object.entries(totals).map(
			([name, amount]) => ({ name, amount })
		);
	}

	/**
	 * Returns sum of the items' total
	 *
	 * @return {Decimal}
	 */
	@computed
	get itemsTotal() {
		return this.items.reduce(
			(sum, item) => sum.add(item.total),
			new Decimal(0)
		);
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
	 * itemsTotal() - creditsTotal()
	 *
	 * @return {Decimal}
	 */
	@computed
	get total() {
		return this.itemsTotal.sub(this.creditsTotal);
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
	 * - credit
	 *
	 * But the following fields can be changed, so we create a deep copy :
	 * - note (string, so deep copy is not applicable)
	 * - customer
	 * - roomSelections
	 *
	 * @return {Object}
	 */
	createRestorationData() {
		return {
			note: this.note,
			items: this.items.slice(),
			transactions: this.transactions.slice(),
			credits: this.credits.slice(),
			customer: this.customer.clone(),
			roomSelections: this.roomSelections.map(roomSelection => roomSelection.clone()),
		};
	}

	/**
	 * Returns a OrderChanges containing changes between the current properties of the Order and the
	 * ones in the restoration data that were set by recordChanges().
	 *
	 * Note that for items, transactions and credits, only new elements are considered changes. We
	 * do not track modification, reordering, suppression, ... since it is not allowed in an Order.
	 *
	 * For Customer, any change in its values is considered a whole customer change.
	 *
	 * For RoomSelection, any change (a new RoomChange, a modif in one, ...) is considered a change
	 * for ALL the RoomSelection (any change in any RoomSelection will consider the whole list as
	 * changed.)
	 */
	getChanges() {
		if (this.restorationData === null || typeof this.restorationData !== 'object') {
			return null;
		}

		const old = this.restorationData;
		const changes = new OrderChanges();
		let foundChanges = false;

		if (this.note !== old.note) {
			changes.note = this.note;
			foundChanges = true;
		}

		['items', 'transactions', 'credits'].forEach((field) => {
			const diff = arrayDifference(this[field], old[field]);
			if (diff.length) {
				changes[field] = diff;
				foundChanges = true;
			}
		});

		if (!this.customer.isEqualTo(old.customer)) {
			changes.customer = this.customer.clone();
			foundChanges = true;
		}

		if (this.didRoomSelectionsChanged(old)) {
			changes.roomSelections = this.roomSelections.map(roomSelection => roomSelection.clone());
			foundChanges = true;
		}

		return foundChanges ? changes : null;
	}

	/**
	 * Compares the current roomSelections with the ones in 'old'. If any change is detected, returns
	 * true.
	 *
	 * @param {RoomSelections} old
	 * @return {Boolean}
	 */
	didRoomSelectionsChanged(old) {
		if (old.roomSelections.length !== this.roomSelections.length) {
			return true;
		}

		const changed = this.roomSelections.find(
			(roomSelection, index) => !roomSelection.isEqualTo(old.roomSelections[index])
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
	 * Validates itself. Valid only if all items are valid and all credits are valid. If valid,
	 * returns undefined, else returns an object where the keys are the invalid attributes.
	 *
	 * @return {Object}
	 */
	validate() {
		let valid = true;
		let res = {};
		const resItems = this.validateItems();
		const resCredits = this.validateCredits();

		if (resItems) {
			valid = false;
			res = { ...res, ...resItems };
		}

		if (resCredits) {
			valid = false;
			res = { ...res, ...resCredits };
		}

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
				res = { items: ['An item is invalid']};
				return true;
			}

			return false;
		});

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
				res = { credits: ['A credit is invalid']};
				return true;
			}

			return false;
		});

		return res;
	}
}

export default Order;
