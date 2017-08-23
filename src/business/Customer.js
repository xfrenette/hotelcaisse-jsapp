import { identifier, serializable } from 'serializr';
import { observable } from 'mobx';
import isEqual from 'lodash.isequal';
import { fieldValues } from '../vendor/serializr/propSchemas';

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
	 * @type {Map}
	 */
	@serializable(fieldValues())
	@observable
	fieldValues = new Map();
	/**
	 * References to Field object for which we store values in fieldValues. Setting this attribute
	 * is optionnal, but required if we want to use get() or validate(). This attribute is not
	 * serialized.
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
		if (this.fieldValues.has(field.uuid)) {
			return this.fieldValues.get(field.uuid);
		}

		return null;
	}

	/**
	 * Sets the value for the field. The value must be a primitive.
	 *
	 * @param {Field} field
	 * @param {mixed} value
	 */
	setFieldValue(field, value) {
		this.fieldValues.set(field.uuid, value);
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
		const clone = new Customer();
		clone.uuid = this.uuid;
		clone.fieldValues.replace(this.fieldValues);
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

		return isEqual(this.fieldValues.toJS(), other.fieldValues.toJS());
	}

	/**
	 * Validate itself by validating all its fields. Returns undefined if valid, else returns an
	 * object where the key is the UUID of the field in error and its value an array of errors. Note
	 * the fields attribute must be set with the Fields for the validation to work, else returns
	 * undefined.
	 *
	 * @return {undefined|Object}
	 */
	validate() {
		const res = {};
		let valid = true;

		this.fields.forEach((field) => {
			const fieldValidation = field.validate(this.getFieldValue(field));
			if (fieldValidation) {
				res[field.uuid] = fieldValidation;
				valid = false;
			}
		});

		return valid ? undefined : res;
	}
}

export default Customer;
