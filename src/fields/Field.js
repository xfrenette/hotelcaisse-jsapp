import { serializable, identifier } from 'serializr';
import validate from '../Validator';

/**
 * A field is a name-value pair of a specific type. They are used in some classes that have a
 * variable number of attributes, that are generaly editable by the user. This class is a generic
 * field (only a name-value pair of strings), but it can be extended for more specific needs.
 */
class Field {
	/**
	 * Unique id of this field
	 *
	 * @type {String}
	 */
	@serializable(identifier())
	uuid = null;
	/**
	 * Name of this field
	 *
	 * @type {String}
	 */
	@serializable
	name = null;
	/**
	 * If true, the value is required and cannot be null.
	 *
	 * @type {Boolean}
	 */
	@serializable
	required = false;

	/**
	 * Validates if a value is a valid value for this field, checking presence if required and
	 * against constraints, if passed. Returns undefined if valid, else returns an array of error
	 * messages.
	 *
	 * @param {mixed} value The value to validate
	 * @param {Object} constraints Optional
	 * @return {Array}
	 */
	validate(value, constraints) {
		let finalConstraints = {};

		if (this.required) {
			finalConstraints.presence = true;
		}

		if (constraints) {
			finalConstraints = {
				...finalConstraints,
				...constraints,
			};
		}

		if (Object.keys(finalConstraints).length === 0) {
			return undefined;
		}

		const res = validate(
			{ value },
			{ value: finalConstraints }
		);

		return res ? res.value : res;
	}
}

export default Field;
