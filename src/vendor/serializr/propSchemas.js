import Decimal from 'decimal.js';
import { deserialize, serialize } from 'serializr';

/**
 * Custom PropSchemas that can be used with serializr to serialize:
 * - decimal: for decimal.js instances
 * - productTax: for tax objects in a Product
 * - rawObject: for used with literal objects that can be validly saved to JSON as is
 * - field: for Field instances, that can be of different sub type (ex: EmailField, TextField, ...)
 *
 * @see https://github.com/mobxjs/serializr
 * @see https://mikemcl.github.io/decimal.js
 */

const decimalPropSchema = {
	/**
	 * Serializer function that returns the value of toString() called on the Decimal instance.
	 * Returns null (or undefined) if the value is null (or undefined). Throws an Error if not a
	 * Decimal instance.
	 *
	 * @param {Decimal} value
	 * @return {string|null|undefined}
	 */
	serializer(value) {
		if (value === null || value === undefined) {
			return value;
		}

		if (!(value instanceof Decimal)) {
			throw new Error('Expected Decimal object');
		}

		return value.toString();
	},

	/**
	 * Deserializer function that calls callback with the Decimal instance created from the
	 * jsonValue. If jsonValue is null (or undefined), returns null (or undefined).
	 *
	 * @param {string|null|undefined} jsonValue
	 * @param {Function} callback
	 */
	deserializer(jsonValue, callback) {
		if (jsonValue === null || jsonValue === undefined) {
			callback(null, jsonValue);
			return;
		}

		callback(null, new Decimal(jsonValue));
	},
};

const rawObjectPropSchema = {
	/**
	 * Serializer function that returns the literal object as is.
	 *
	 * @param {object} value
	 * @return {object|null|undefined}
	 */
	serializer(value) {
		return value;
	},

	/**
	 * Deserializer function that calls callback with the jsonValue object as is.
	 *
	 * @param {object|null|undefined} jsonValue
	 * @param {Function} callback
	 */
	deserializer(jsonValue, callback) {
		callback(null, jsonValue);
	},
};

const fieldPropSchema = {
	/**
	 * The serializer function simply serializes the instance. The "magic" happens when
	 * deserializing.
	 *
	 * @param {Field} value
	 * @return {string|null|undefined}
	 */
	serializer(value) {
		return serialize(value);
	},

	/**
	 * Deserializer function that will create a correct instance of a Field based on its type
	 * attribute.
	 *
	 * @param {Object|null|undefined} jsonValue
	 * @param {Function} callback
	 */
	deserializer(jsonValue, callback) {
		// eslint-disable-next-line global-require
		const fields = require('../../fields');

		if (jsonValue === null || jsonValue === undefined) {
			callback(null, jsonValue);
			return;
		}

		const type = jsonValue.type;

		if (!type) {
			callback(null, null);
			return;
		}

		if (fields[type]) {
			const instance = deserialize(fields[type], jsonValue);
			callback(null, instance);
			return;
		}

		callback(null, null);
	},
};

/**
 * Serializes a Map {<key1>:<value1>, <key2>:<value2>} to an array
 * [{fieldId:<key1>, value:<value1>}, {fieldId:<key2>, value:<value2>}]
 */
const fieldValuesPropSchema = {
	/**
	 * Serializer function that converts the Map to an array of objects.
	 *
	 * @param {Map} value
	 * @return {array|null|undefined}
	 */
	serializer(value) {
		if (value === null || value === undefined) {
			return value;
		}

		const serialized = [];

		value.forEach((fieldValue, key) => {
			serialized.push({
				fieldId: key,
				value: fieldValue,
			});
		});

		return serialized;
	},

	/**
	 * Deserializer function that converts the array of objects to a Map
	 *
	 * @param {array|null|undefined} jsonValue
	 * @param {Function} callback
	 */
	deserializer(jsonValue, callback) {
		if (jsonValue === null || jsonValue === undefined) {
			callback(null, jsonValue);
			return;
		}
		const deserialized = new Map(jsonValue.map(obj => [obj.fieldId, obj.value]));

		callback(null, deserialized);
	},
};

const timestampPropSchema = {
	/**
	 * Serializer function that returns the literal object as is.
	 *
	 * @param {Date} value
	 * @return {Integer|null|undefined}
	 */
	serializer(value) {
		if (value === null || value === undefined) {
			return value;
		}

		return Math.round(value.getTime() / 1000);
	},

	/**
	 * Deserializer function that calls callback with the jsonValue object as is.
	 *
	 * @param {Number|null|undefined} jsonValue
	 * @param {Function} callback
	 */
	deserializer(jsonValue, callback) {
		if (jsonValue === null || jsonValue === undefined) {
			callback(null, jsonValue);
			return;
		}

		callback(null, new Date(jsonValue * 1000));
	},
};

export const decimal = () => decimalPropSchema;
export const rawObject = () => rawObjectPropSchema;
export const field = () => fieldPropSchema;
export const fieldValues = () => fieldValuesPropSchema;
export const timestamp = () => timestampPropSchema;
