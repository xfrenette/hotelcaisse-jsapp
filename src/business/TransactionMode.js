import { serializable } from 'serializr';

/**
 * Represents a method used for a Transaction. Examples :
 * cash, credit card, ...
 */
class TransactionMode {
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
	constructor(name) {
		this.name = name;
	}
}

export default TransactionMode;
