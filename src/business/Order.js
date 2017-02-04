/**
 * An Order represents a list of items sold to a customer.
 * Besides the items (that can also include refunded items)
 * the Order will contain Credits (deposits) the customer has
 * already paid, payments or refunds (Transactions).
 */
class Order {
	state = STATES.NEW;
	createdAt = null;
	items = [];
	credits = [];
	transactions = [];
	notes = '';
	customerInformation = {
		name: '',
		email: '',
	};

	/**
	 * Returns the total amount to pay (or to refund, if negative)
	 * for this order.
	 *
	 * total() - transactionsTotal()
	 *
	 * @return {Decimal}
	 */
	get balance() {

	}

	/**
	 * Returns total price of the order.
	 *
	 * itemsTotal() - depositsTotal()
	 *
	 * @return {Decimal}
	 */
	get total() {

	}

	/**
	 * Returns the total price of the items, before taxes
	 *
	 * @return {Decimal}
	 */
	get itemsSubTotal() {

	}

	/**
	 * Returns total price of the items, including taxes
	 *
	 * @return {Decimal}
	 */
	get itemsTotal() {

	}

	/**
	 * Returns an array of tax total prices where each tax total
	 * is an object with 'name' and 'amount' keys.
	 *
	 * [
	 * 	{name:<String>, amount:<Decimal>},
	 * 	...
	 * ]
	 *
	 * @return {array}
	 */
	get taxesTotal() {

	}

	/**
	 * Returns total amount of the deposits
	 *
	 * @return {Decimal}
	 */
	get depositsTotal() {

	}

	/**
	 * Returns total amount of transactions (payments and refunds)
	 *
	 * @return {Decimal}
	 */
	get transactionsTotal() {

	}

	/**
	 * Saves the transaction.
	 */
	save() {
		// this.state = STATES.SAVED
	}
}

export default Order;
export const STATES = {
	NEW: 0,
	SAVED: 1,
};
