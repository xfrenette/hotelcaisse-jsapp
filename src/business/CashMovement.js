import { serializable, date } from 'serializr';
import { decimal } from '../vendor/serializr/propSchemas';

/**
 * A CashMovement represents an addition or substraction of physical cash from
 * the Register that is not a payment/reimbursement from/to a customer. A
 * CashMovement is generally added to a Register. See Payment for transactions
 * with a customer.
 */
class CashMovement {
	/**
	 * Unique identifier of this CashMovement
	 *
	 * @type {String}
	 */
	@serializable
	uuid = null;
	/**
	 * Amount of the cash movement
	 *
	 * @type {Decimal}
	 */
	@serializable(decimal())
	amount = null;
	/**
	 * Optionnal note for this cash movement.
	 *
	 * @type {String}
	 */
	@serializable
	note = '';
	/**
	 * Creation date time
	 *
	 * @type {Date}
	 */
	@serializable(date())
	createdAt = null;
	/**
	 * Register where this cash movement is saved. It is set when calling
	 * Register#addCashMovement(CashMovement).
	 *
	 * @todo It is not (de)serializable yet.
	 * @type {Register}
	 */
	register = null;

	constructor(amount) {
		this.createdAt = new Date();

		if (amount) {
			this.amount = amount;
		}
	}
}

export default CashMovement;
