import { serializable } from 'serializr';
import Field from './Field';

/**
 * The YesNoField is a field which allows 2 values: yes/true (1) and no/false (0)
 */
class YesNoField extends Field {
	@serializable
	type = 'YesNoField';

	/**
	 * Validates the value.
	 *
	 * @param {Number} value
	 * @return {Array}
	 */
	validate(value) {
		const numberValue = parseFloat(value);
		if (numberValue === 1 || numberValue === 0) {
			return undefined;
		}

		return ['Valid values are 1 and 0.'];
	}
}

export default YesNoField;
