import { serializable } from 'serializr';
import { rawObject } from '../vendor/serializr/propSchemas';
import Field from './Field';

/**
 * The SelectField is a field where the value is in a list of valid values. It also supports label
 * for each values.
 */
class SelectField extends Field {
	/**
	 * All possible values. An object where the key is the choice value and the value is the choice
	 * label.
	 *
	 * @type {Object}
	 */
	@serializable(rawObject())
	values = {};

	/**
	 * Returns an array of all the values
	 *
	 * @return {Array}
	 */
	getValues() {
		return Object.keys(this.values);
	}

	/**
	 * Returns the labal for a value
	 *
	 * @param {String} value
	 * @return {String}
	 */
	getLabel(value) {
		return this.values[value];
	}

	/**
	 * Validates the value.
	 *
	 * @return {Array}
	 */
	validate() {
		const constraints = {
			inclusion: this.getValues(),
		};

		return super.validate(constraints);
	}
}

export default SelectField;
