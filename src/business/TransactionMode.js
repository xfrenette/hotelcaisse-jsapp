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
	 * If true, this TransactionMode is archived and cannot be used for new Transaction
	 *
	 * @type {Boolean}
	 */
	@serializable
	archived = false;
	/**
	 * Type of this TransactionMode (can be null)
	 * @type {String}
	 */
	@serializable
	type = null;

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
