import { serializable, date, object } from 'serializr';
import TransactionMode from './TransactionMode';
import { decimal } from '../vendor/serializr/propSchemas';

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
	@serializable(decimal())
	amount = null;
	/**
	 * Transaction mode used.
	 *
	 * @type {TransactionMode}
	 */
	@serializable(object(TransactionMode))
	transactionMode = null;
	/**
	 * Optionnal note.
	 *
	 * @type {String}
	 */
	@serializable
	note = '';
	/**
	 * Creation date time.
	 *
	 * @type {Date}
	 */
	@serializable(date())
	createdAt = null;
	/**
	 * Register where this transaction is saved. It is set when calling
	 * Register#addTransaction(Transaction).
	 *
	 * Note that we need this information only when creating new Transaction, not when viewing
	 * already existing ones, so this reference will probably stay null if this is not a new
	 * Transaction. For this reason, the register property is not serialized.
	 *
	 * @type {Register}
	 */
	register = null;

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
