import { serializable, date } from 'serializr';
import { decimal } from '../vendor/serializr/propSchemas';

/**
 * A Credit represents an amount of money a customer has already paid outside
 * of the system. It is generally applied (added) to an Order.
 */
class Credit {
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

	constructor(amount) {
		this.createdAt = new Date();

		if (amount) {
			this.amount = amount;
		}
	}
}

export default Credit;
