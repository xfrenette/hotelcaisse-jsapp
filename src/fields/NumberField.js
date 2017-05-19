import { serializable } from 'serializr';
import { rawObject } from '../vendor/serializr/propSchemas';
import Field from './Field';

/**
 * The NumberField is simply a field that has a numeric value. Setup the constraints object to limit
 * possible values.
 */
class NumberField extends Field {
	@serializable
	type = 'NumberField';

	@serializable(rawObject())
	/**
	 * Additional numericality constraints (see the "numericality" constraint). By default, set to
	 * true (meaning no other constraints beside being a numeric).
	 *
	 * @type {Boolean|Object}
	 */
	constraints = true;

	/**
	 * Validates the value.
	 *
	 * @param {Number} value
	 * @return {Array}
	 */
	validate(value) {
		const constraints = {
			numericality: this.constraints,
		};

		return super.validate(value, constraints);
	}
}

export default NumberField;
