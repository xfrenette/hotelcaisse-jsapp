import { serializable } from 'serializr';
import { rawObject } from './vendor/serializr/propSchemas';

/**
 * Class that represents changes to data. It contains a type specifying the type of change and data
 * representing the change. Used to send data updates to the API.
 */
class DataChange {
	/**
	 * Type of the change.
	 *
	 * @type {String}
	 */
	@serializable
	type = null;
	/**
	 * Data of the change. Must be a JavaScript literal if the DataChange will be serialized.
	 *
	 * @type {mixed}
	 */
	@serializable(rawObject())
	data = null;

	/**
	 * @param {String} type
	 * @param {mixed} data
	 */
	constructor(type = null, data = null) {
		this.type = type;
		this.data = data;
	}
}

export default DataChange;
