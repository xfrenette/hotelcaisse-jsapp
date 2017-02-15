import Decimal from 'decimal.js';

/**
 * Custom PropSchemas that can be used with serializr to serializ:
 * decimal: for decimal.js instances
 *
 * @see https://github.com/mobxjs/serializr
 * @see https://mikemcl.github.io/decimal.js
 */

/**
 * Serializer function that returns the value of toString() called on the
 * Decimal instance. Returns null (or undefined) if the value is null (or
 * undefined). Throws an Error if not a Decimal instance.
 *
 * @param {Decimal} value
 * @return {string|null|undefined}
 */
function serializer(value) {
	if (value === null || value === undefined) {
		return value;
	}

	if (!(value instanceof Decimal)) {
		throw new Error('Expected Decimal object');
	}

	return value.toString();
}

/**
 * Deserializer function that calls callback with the Decimal instance created
 * from the jsonValue. If jsonValue is null (or undefined), returns null (or
 * undefined).
 *
 * @param {string|null|undefined} jsonValue
 * @param {Function} callback
 */
function deserializer(jsonValue, callback) {
	if (jsonValue === null || jsonValue === undefined) {
		callback(null, jsonValue);
		return;
	}

	callback(null, new Decimal(jsonValue));
}

// eslint-disable-next-line import/prefer-default-export
export const decimal = () => ({
	serializer,
	deserializer,
});
