import { serializable, identifier } from 'serializr';

/**
 * Represents a method used for a Transaction. Examples : cash, credit card, ...
 */
class TransactionMode {
	/**
	 * ID of the transaction mode.
	 *
	 * @type {String}
	 */
	@serializable(identifier())
	id = null;
	/**
	 * Name of the transaction mode.
	 *
	 * @type {String}
	 */
	@serializable
	name = '';

	/**
	 * @param {Integer} id
	 * @param {String} name
	 */
	constructor(id = null, name = null) {
		this.id = id;
		this.name = name;
	}
}

export default TransactionMode;
