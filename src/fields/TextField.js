import Field from './Field';

/**
 * The TextField is a field accepting strings.
 */
class TextField extends Field {
	/**
	 * Validates the value.
	 *
	 * @param {String} value
	 * @return {Array}
	 */
	validate(value) {
		const constraints = {
			typeOf: 'string',
		};

		return super.validate(value, constraints);
	}
}

export default TextField;
