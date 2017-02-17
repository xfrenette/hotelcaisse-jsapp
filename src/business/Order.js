import { serializable, list, date, object } from 'serializr';
import Decimal from 'decimal.js';
import Item from './Item';
import Credit from './Credit';
import Transaction from './Transaction';

/**
 * An Order, associated with a Customer, contains a list of Items sold (or reimbursed), a list of
 * Credits and a list of Transactions (payments or refunds).
 */
class Order {
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
	customer = null;

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
}

export default Order;
