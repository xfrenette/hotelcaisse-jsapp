import { identifier, object, serializable } from 'serializr';
import { observable } from 'mobx';
import { decimal, timestamp } from '../vendor/serializr/propSchemas';
import validate from '../Validator';
import utils from '../utils';
import TransactionMode from './TransactionMode';

/**
 * Constraints for validation.
 *
 * @type {Object}
 */
const constraints = {
	amount: {
		presence: true,
		decimal: { notEqualTo: 0 },
	},
};

/**
 * A Transaction is an exchange of money between the business and the customer. The Transaction is
 * generally added to the active register and to an Order. The amount sign (positive or negative)
 * is as viewed by the business (a payment from a customer is positive, a refund is
 * negative). A Transaction is made with a specific TransactionMode (cash, credit card, ...)
 */
class Transaction {
	/**
	 * UUID of the transaction
	 *
	 * @type {String}
	 */
	@serializable(identifier())
	uuid = null;
	/**
	 * Amount of the transaction. Positive is a payment,
	 * negative is a refund.
	 *
	 * @type {Decimal}
	 */
	@serializable(decimal())
	@observable
	amount = null;
	/**
	 * Transaction mode used.
	 *
	 * @type {TransactionMode}
	 */
	@serializable(object(TransactionMode))
	@observable
	transactionMode = null;
	/**
	 * Optional note.
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
	@serializable(timestamp())
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

	constructor(uuid = null, amount = null, transactionMode = null) {
		this.createdAt = new Date();
		this.uuid = uuid;
		this.amount = amount;
		this.transactionMode = transactionMode;
	}

	/**
	 * Freezes this Transaction by making a clone of TransactionMode
	 */
	freeze() {
		this.transactionMode = this.transactionMode.clone();
	}
}

/**
 * Validates the values for a new Credit. Will validate only the attributes passed in values. Values
 * is an object where the key is the attribute and its value is the attribute's value. On success,
 * returns undefined, else returns an object with the error(s) for each attribute.
 *
 * @param {Object} values
 * @return {Object|undefined}
 */
Transaction.validate = (values) => {
	const appliedConstraints = utils.getConstraintsFor(constraints, values);
	return validate(values, appliedConstraints);
};

export default Transaction;
