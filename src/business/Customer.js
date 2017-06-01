import { serializable, identifier } from 'serializr';
import isEqual from 'lodash.isequal';
import { rawObject } from '../vendor/serializr/propSchemas';

/**
 * Represents a customer and all its information.
 */
class Customer {
	/**
	 * Unique identifier of this Customer
	 *
	 * @type {String}
	 */
	@serializable(identifier())
	uuid = null;
	/**
	 * Values for each of the fields. Key is field uuid and the value is a primitive.
	 *
	 * @type {Object}
	 */
	@serializable(rawObject())
	fieldValues = {};
	/**
	 * References to Field object for which we store values in fieldValues. Setting this attribute is
	 * optionnal, but required if we want to use get(). This attribute is not serialized.
	 *
	 * @type {Array<Field>}
	 */
	fields = [];

	constructor(uuid = null) {
		this.uuid = uuid;
	}

	/**
	 * Returns the value saved for the specified Field. Returns null if no value is found.
	 *
	 * @param {Field} field
	 * @return {mixed}
	 */
	getFieldValue(field) {
		if (this.fieldValues[field.uuid] !== undefined) {
			return this.fieldValues[field.uuid];
		}

		return null;
	}

	/**
	 * Returns the value saved for the Field with the specified role. The fields attribute must be
	 * set with the Fields to search before we can return the value saved for this field. Returns
	 * null if no value found.
	 *
	 * @param {String} role
	 * @return {mixed}
	 */
	get(role) {
		let value = null;

		this.fields.find((field) => {
			if (field.role === role) {
				value = this.getFieldValue(field);
				return true;
			}
			return false;
		});

		return value;
	}

	/**
	 * Returns a clone of this Customer (a new object)
	 *
	 * @return {Customer}
	 */
	clone() {
		const clone = Object.assign(Object.create(this), this);
		clone.fieldValues = {
			...this.fieldValues,
		};
		return clone;
	}

	/**
	 * Returns true if this Customer is equal (same attributes and fieldValues) as another Customer.
	 *
	 * @param {Customer} other
	 * @return {Boolean}
	 */
	isEqualTo(other) {
		if (this.uuid !== other.uuid) {
			return false;
		}

		return isEqual(this.fieldValues, other.fieldValues);
	}
}

export default Customer;
