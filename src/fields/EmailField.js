import Field from './Field';

/**
 * The EmailField is a field accepting only an email address.
 */
class EmailField extends Field {
	/**
	 * Validates the value.
	 *
	 * @param {String} value
	 * @return {Array}
	 */
	validate(value) {
		const constraints = {
			email: true,
		};

		return super.validate(value, constraints);
	}
}

export default EmailField;
