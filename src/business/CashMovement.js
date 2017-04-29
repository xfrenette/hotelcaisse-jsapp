import { serializable, date, identifier } from 'serializr';
import validate from '../Validator';
import utils from '../utils';
import { decimal } from '../vendor/serializr/propSchemas';

/**
 * Constraints for validation.
 *
 * @type {Object}
 */
const constraints = {
	amount: {
		presence: true,
		decimal: true,
	},
	note: {
		typeOf: 'string',
	},
};

/**
 * A CashMovement represents an addition or substraction of physical cash from
 * the Register that is not a payment/reimbursement from/to a customer. A
 * CashMovement is generally added to a Register. See Payment for transactions
 * with a customer.
 *
 * Note, no validation of the data is done when setting data, so be sure to call
 * CashMovement.validate with the values before setting them.
 */
class CashMovement {
	/**
	 * Unique identifier of this CashMovement
	 *
	 * @type {String}
	 */
	@serializable(identifier())
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

	constructor(uuid = null, amount = null, note = null) {
		this.createdAt = new Date();
		this.uuid = uuid;
		this.amount = amount;
		this.note = note;
	}
}

CashMovement.validate = (values) => {
	const appliedConstraints = utils.getConstraintsFor(constraints, values);
	return validate(values, appliedConstraints);
};

export default CashMovement;
