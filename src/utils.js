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
};
