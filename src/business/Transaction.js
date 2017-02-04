/**
 * A Transaction is an exchange of money between the business
 * and the customer. The Transaction will certainly be added
 * to the active register (to note it) and to an Order.
 * It can be a payment (positive amount) or a refund (negative
 * amount). A Transaction is made with a specific TransactionMode
 * (cash, credit card, ...)
 */
class Transaction {
	amount = null;
	createdAt = null;
	transactionMode = null;
	note = null;
}

export default Transaction;
