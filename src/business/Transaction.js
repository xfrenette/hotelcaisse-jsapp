/**
 * A Transaction is an exchange of money between the business
 * and the customer. The Transaction is generally added
 * to the active register and to an Order. It can be a payment
 * (positive amount) or a refund (negative amount) from or to a
 * customer. A Transaction is made with a specific
 * TransactionMode (cash, credit card, ...)
 */
class Transaction {
	/**
	 * Amount of the transaction. Positive is a payment,
	 * negative is a refund.
	 *
	 * @type {Decimal}
	 */
	amount = null;
	/**
	 * Transaction mode used.
	 *
	 * @type {TransactionMode}
	 */
	transactionMode = null;
	/**
	 * Optionnal note.
	 *
	 * @type {String}
	 */
	note = '';
	/**
	 * Creation date time.
	 *
	 * @type {Date}
	 */
	createdAt = null;

	/**
	 * @param {Decimal} amount
	 * @param {TransactionMode} transactionMode
	 */
	constructor(amount, transactionMode) {
		this.createdAt = new Date();
		this.amount = amount;
		this.transactionMode = transactionMode;
	}
}

export default Transaction;
