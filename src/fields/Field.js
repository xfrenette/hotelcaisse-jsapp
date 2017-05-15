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
	 * Value of the field
	 *
	 * @type {String}
	 */
	@serializable
	value = null;
	/**
	 * If true, the value is required and cannot be null.
	 *
	 * @type {Boolean}
	 */
	@serializable
	required = false;

	/**
	 * Validates the value. Returns undefined if valid, else returns an array of errors. A constraint
	 * object can be passed that will be used with Validator.
	 *
	 * @return {Array}
	 */
	validate(constraints) {
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
			{ value: this.value },
			{ value: finalConstraints }
		);

		return res ? res.value : res;
	}
}

export default Field;
