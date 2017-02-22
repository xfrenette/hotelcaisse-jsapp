import { serializable, list, date, object, identifier } from 'serializr';
import postal from 'postal';
import Decimal from 'decimal.js';
import arrayDifference from 'lodash.difference';
import { CHANNELS, TOPICS } from '../const/message-bus';
import Item from './Item';
import Credit from './Credit';
import Transaction from './Transaction';
import Customer from './Customer';

/**
 * All messages by this class are published on the same channel.
 *
 * @type {ChannelDefinition}
 */
const channel = postal.channel(CHANNELS.order);

/**
 * An Order, associated with a Customer, contains a list of Items sold (or reimbursed), a list of
 * Credits and a list of Transactions (payments or refunds).
 *
 * We wish the Order to send a message when it is modified. But since the desired new Order may
 * require mult iple changes (ex: 2 new items, 1 new payment mode, 1 new credit, all done one at a
 * time), it could clutter the system if a message had to be processed for each modifications. To
 * fix this, the Order comes with a 'modifications transaction' feature: you start recording
 * changes by calling recordChanges(), you modify the Order as you and then you call commit() when
 * finished. This will publish a 'commit' message containing only the changes that were made. This
 * system also allows for a revert() method that can cancel all the modifications
 */
class Order {
	/**
	 * UUID of the register
	 *
	 * @type {String}
	 */
	@serializable(identifier())
	uuid = 'Order-TODO';
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
	@serializable(list(object(Item)))
	items = [];
	/**
	 * List of Credits.
	 *
	 * @type {Array<Credit>}
	 */
	@serializable(list(object(Credit)))
	credits = [];
	/**
	 * List of Transactions.
	 *
	 * @type {Array<Transaction>}
	 */
	@serializable(list(object(Transaction)))
	transactions = [];
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

	constructor() {
		this.createdAt = new Date();
	}

	/**
	 * Returns the total of the items' subtotal (which is before taxes).
	 *
	 * @return {Decimal}
	 */
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
	get creditsTotal() {
		return this.credits.reduce(
			(prevSum, credit) => prevSum.add(credit.amount),
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
	get balance() {
		return this.total.sub(this.transactionsTotal);
	}

	/**
	 * Adds an Item to the array and publishes a message.
	 *
	 * @param {Item} item
	 */
	addItem(item) {
		this.items.push(item);

		channel.publish(TOPICS.order.item.added, {
			item,
			order: this,
		});
	}

	/**
	 * Adds a Credit to the array and publishes a message.
	 *
	 * @param {Credit} credit
	 */
	addCredit(credit) {
		this.credits.push(credit);

		channel.publish(TOPICS.order.credit.added, {
			credit,
			order: this,
		});
	}

	/**
	 * Adds a Transaction to the array and publishes a message.
	 *
	 * @param {Transaction} transaction
	 */
	addTransaction(transaction) {
		this.transactions.push(transaction);

		channel.publish(TOPICS.order.transaction.added, {
			transaction,
			order: this,
		});
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

		const fields = ['note', 'items', 'credits', 'transactions'];
		fields.forEach((field) => {
			if (restorationData[field]) {
				this[field] = restorationData[field];
			}
		});

		if (restorationData.customer) {
			this.customer = restorationData.customer;
		}
	}

	/**
	 * Creates an object of restoration data of the current state of the Order.
	 *
	 * @return {Object}
	 */
	createRestorationData() {
		return {
			note: this.note,
			items: [...this.items],
			transactions: [...this.transactions],
			credits: [...this.credits],
			customer: this.customer.clone(),
		};
	}

	/**
	 * Returns an object of changes between the current properties of the Order and the ones in the
	 * restoration data that were set by recordChanges().
	 *
	 * Note that for items, transactions and credits, only new elements are considered changes. We do
	 * not track modification, reordering, suppression, ... since it is not allowed in an Order.
	 */
	getChanges() {
		if (this.restorationData === null || typeof this.restorationData !== 'object') {
			return null;
		}

		const old = this.restorationData;
		const changes = {};

		if (this.note !== old.note) {
			changes.note = this.note;
		}

		['items', 'transactions', 'credits'].forEach((field) => {
			const diff = arrayDifference(this[field], old[field]);
			if (diff.length) {
				changes[field] = diff;
			}
		});

		if (!this.customer.isEqualTo(old.customer)) {
			changes.customer = this.customer;
		}

		return Object.keys(changes).length ? changes : null;
	}
}

export default Order;
