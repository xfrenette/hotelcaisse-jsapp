export default {
	/**
	 * Returns a subset of the allConstraints object where only the constraints for the values are
	 * included. In other words, if a constraint is not in the values, it will not be included.
	 *
	 * @param {Object} allConstraints
	 * @param {Object} values
	 * @return {Object}
	 */
	getConstraintsFor(allConstraints, values) {
		const constraints = {};
		Object.keys(values).forEach((key) => {
			const hasKey = Object.prototype.hasOwnProperty.call(allConstraints, key);
			if (hasKey) {
				constraints[key] = allConstraints[key];
			}
		});

		return constraints;
	},

	/**
	 * Does variable interpolation in the string. Every %{<key>} will be replaced by the value of
	 * <key> in the variables object.
	 *
	 * Ex: stringInterpolation('Hello %{name}, bye', { name: 'John' }) will return 'Hello John, bye'.
	 *
	 * @param {String} string
	 * @param {Object} variables
	 * @return {String}
	 */
	stringInterpolation(string, variables) {
		let replaced = string;
		Object.entries(variables).forEach(([key, value]) => {
			const regexp = new RegExp(`%{${key}}`, 'g');
			replaced = replaced.replace(regexp, value);
		});

		return replaced;
	},
};
