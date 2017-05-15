import Field from './Field';

/**
 * The EmailField is a field accepting only an email address.
 */
class EmailField extends Field {
	/**
	 * Validates the value.
	 *
	 * @return {Array}
	 */
	validate() {
		const constraints = {
			email: true,
		};

		return super.validate(constraints);
	}
}

export default EmailField;
