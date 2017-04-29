import { serializable, date, identifier } from 'serializr';
import { decimal } from '../vendor/serializr/propSchemas';

/**
 * A Credit represents an amount of money a customer has already paid outside of the system. It is
 * generally applied (added) to an Order.
 */
class Credit {
	/**
	 * UUID of this credit.
	 *
	 * @type {String}
	 */
	@serializable(identifier())
	uuid = null;
	/**
	 * Amount of the credit.
	 *
	 * @type {Decimal}
	 */
	@serializable(decimal())
	amount = null;
	/**
	 * Optional note for this credit.
	 *
	 * @type {String}
	 */
	@serializable
	note = '';
	/**
	 * Creation date time.
	 *
	 * @type {Date}
	 */
	@serializable(date())
	createdAt = null;

	constructor(uuid = null, amount = null, note = null) {
		this.createdAt = new Date();
		this.uuid = uuid;
		this.amount = amount;
		this.note = note;
	}
}

export default Credit;
