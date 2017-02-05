/**
 * A Credit represents an amount of money a customer has already
 * paid outside of the system.
 * It is generally applied (added) to an Order.
 */
class Credit {
	/**
	 * Amount of the credit.
	 *
	 * @type {Decimal}
	 */
	amount = null;
	/**
	 * Optionnal note for this credit.
	 *
	 * @type {String}
	 */
	note = '';
	/**
	 * Creation date time
	 *
	 * @type {Date}
	 */
	createdAt = null;

	constructor(amount) {
		this.createdAt = new Date();

		if (amount) {
			this.amount = amount;
		}
	}
}

export default Credit;
