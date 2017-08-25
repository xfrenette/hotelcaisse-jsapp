import { identifier, serializable } from 'serializr';
import validate from '../Validator';
import utils from '../utils';
import { decimal, timestamp } from '../vendor/serializr/propSchemas';

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
		presence: true,
		typeOf: 'string',
	},
};

/**
 * A CashMovement represents an addition or substraction of physical cash from
 * the Register that is not a payment/refund from/to a customer. A
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
	 * Optional note for this cash movement.
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
	@serializable(timestamp())
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

/**
 * Validates the values for a new CashMovement. Will validate only the attributes passed in values.
 * Values is an object where the key is the attribute and its value is the attribute's value. On
 * success, returns undefined, else returns an object with the error(s) for each attribute.
 *
 * @param {Object} values
 * @return {Object|undefined}
 */
CashMovement.validate = (values) => {
	const appliedConstraints = utils.getConstraintsFor(constraints, values);
	return validate(values, appliedConstraints);
};

export default CashMovement;
