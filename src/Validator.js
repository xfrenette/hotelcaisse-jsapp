import validateLib from 'validate.js';
import Decimal from 'decimal.js';

/**
 * The options MUST be { class: <class> }, because if you just pass <class>, validate will try to
 * run the function.
 */
function instanceOf(value, options) {
	if (validateLib.isEmpty(value)) {
		return null;
	}

	if (!options.class) {
		return 'must pass a class with a constructor';
	}

	if (value instanceof options.class) {
		return null;
	}

	return 'is not the correct instance';
}

/**
 * Checks that value is a Decimal with the following optional options :
 * - min
 * - max
 * - integer
 */
function decimal(value, options) {
	if (validateLib.isEmpty(value)) {
		return null;
	}

	const validateInstanceOfDecimal = instanceOf(value, { class: Decimal });

	if (validateInstanceOfDecimal) {
		return validateInstanceOfDecimal;
	}

	if (typeof options.gt === 'number') {
		if (!value.greaterThan(options.gt)) {
			return `is not greater than ${options.gt}`;
		}
	}

	if (typeof options.gte === 'number') {
		if (!value.greaterThanOrEqualTo(options.gte)) {
			return `is not greater than or equal to ${options.gte}`;
		}
	}

	if (typeof options.lt === 'number') {
		if (!value.lessThan(options.lt)) {
			return `is not lower than ${options.lt}`;
		}
	}

	if (typeof options.lte === 'number') {
		if (!value.lessThanOrEqualTo(options.lte)) {
			return `is not lower than ${options.lte}`;
		}
	}

	if (typeof options.notEqualTo === 'number') {
		if (value.equals(options.notEqualTo)) {
			return `is equal to ${options.notEqualTo}`;
		}
	}

	if (options.int === true && !value.isInteger()) {
		return 'is not lower an integer';
	}

	return null;
}

function typeOf(value, options) {
	if (validateLib.isEmpty(value)) {
		return null;
	}

	const type = typeof options === 'string' ? options : options.type;
	const valueType = typeof value;

	if (valueType !== type) {
		return `is not of type ${type}`;
	}

	return null;
}

validateLib.validators.instanceOf = instanceOf;
validateLib.validators.decimal = decimal;
validateLib.validators.typeOf = typeOf;

export default validateLib;
