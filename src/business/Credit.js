import { identifier, serializable } from 'serializr';
import { observable } from 'mobx';
import Decimal from 'decimal.js';
import isEqual from 'lodash.isequal';
import validate from '../Validator';
import { decimal, timestamp } from '../vendor/serializr/propSchemas';
import utils from '../utils';

/**
 * Constraints for validation.
 *
 * @type {Object}
 */
const constraints = {
	note: {
		presence: true,
		typeOf: 'string',
	},
	amount: {
		presence: true,
		decimal: { gt: 0 },
	},
};

/**
 * A Credit represents an amount of money a customer has already paid outside of the system. It is
 * generally applied (added) to an Order.
 */
class Credit {
	/**
	 * UUID of this credit.
	 *
	 * @type {String}
	 */
	@serializable(identifier())
	uuid = null;
	/**
	 * Amount of the credit.
	 *
	 * @type {Decimal}
	 */
	@serializable(decimal())
	@observable
	amount = null;
	/**
	 * Optional note for this credit.
	 *
	 * @type {String}
	 */
	@serializable
	@observable
	note = '';
	/**
	 * Creation date time.
	 *
	 * @type {Date}
	 */
	@serializable(timestamp())
	createdAt = null;

	constructor(uuid = null, amount = null, note = null) {
		this.createdAt = new Date();
		this.uuid = uuid;
		this.amount = amount;
		this.note = note;
	}

	/**
	 * Validates itself (note and amount)
	 *
	 * @return {Object}
	 */
	validate() {
		return Credit.validate({
			note: this.note,
			amount: this.amount,
		});
	}

	/**
	 * Returns true if `other` is equal to this instance
	 *
	 * @param {Credit} other
	 * @return {boolean}
	 */
	equals(other) {
		return isEqual(this, other);
	}

	/**
	 * Returns a clone of this Credit (a new object)
	 *
	 * @return {Credit}
	 */
	clone() {
		const clone = new Credit();
		clone.uuid = this.uuid;
		clone.note = this.note;
		clone.amount = this.amount ? new Decimal(this.amount) : null;
		clone.createdAt = this.createdAt ? new Date(this.createdAt.getTime()) : null;
		return clone;
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
Credit.validate = (values) => {
	const appliedConstraints = utils.getConstraintsFor(constraints, values);
	return validate(values, appliedConstraints);
};

export default Credit;
