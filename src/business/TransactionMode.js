import { serializable, identifier } from 'serializr';

/**
 * Represents a method used for a Transaction. Examples : cash, credit card, ...
 */
class TransactionMode {
	/**
	 * UUID of the transaction mode.
	 *
	 * @type {String}
	 */
	@serializable(identifier())
	uuid = null;
	/**
	 * Name of the transaction mode.
	 *
	 * @type {String}
	 */
	@serializable
	name = '';

	/**
	 * @param {String} name
	 */
	constructor(uuid = null, name = null) {
		this.uuid = uuid;
		this.name = name;
	}
}

export default TransactionMode;
