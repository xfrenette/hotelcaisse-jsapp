/**
 * A CashMovement represents an addition or substraction of
 * physical cash from the Register that is not a
 * payment/reimbursement from/to a customer.
 * A CashMovement is generally added to a Register.
 * See Payment for transactions with a customer.
 */
class CashMovement {
	/**
	 * Amount of the cash movement
	 *
	 * @type {Decimal}
	 */
	amount = null;
	/**
	 * Optionnal note for this cash movement.
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

export default CashMovement;
