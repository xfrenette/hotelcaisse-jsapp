import { serializable, identifier } from 'serializr';
import validate from '../Validator';

/**
 * A field is a name-value pair of a specific type. They are used in some classes that have a
 * variable number of attributes, that are generaly editable by the user. This class is a generic
 * field (only a name-value pair of strings), but it can be extended for more specific needs.
 */
class Field {
	/**
	 * Type of this field. It is used when deserializing an array of Fields (which can contain
	 * multiple types), to create the correct instance. The value must be a valid key in
	 * src/fields/index.js
	 *
	 * It must be redefined in each sub class. Also, each sub class must have a serializr
	 * ModelSchema, else it will fallback to this class's ModelSchema. Trick: use at least one
	 * @serializable (for example, on the type attribute) to have a ModelSchema generated.
	 *
	 * @type {String}
	 */
	@serializable
	type = 'Field';
	/**
	 * Unique id of this field
	 *
	 * @type {String}
	 */
	@serializable(identifier())
	uuid = null;
	/**
	 * Label of this field
	 *
	 * @type {String}
	 */
	@serializable
	label = null;
	/**
	 * Role of this field. The Field was created to support an unknown number of values in some
	 * objects, but some objects may want to assign specific information to some Field (ex: a
	 * customer name or email address). The role can thus be set (by the server, for example) to mark
	 * some fields as representing those information.
	 *
	 * @type {String}
	 */
	@serializable
	role = null;
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
