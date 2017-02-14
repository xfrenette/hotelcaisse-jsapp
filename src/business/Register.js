/**
 * The Register records all Transactions and CashMovements of a business day.
 *
 * Notes:
 * - Since the frontend app does not need to keep Transactions with the Register, this class does
 * not keep them, see the implementation of addTransaction()
 * - POST = Point Of Sale Terminal (credit/debit cards terminal)
 */
class Register {
	/**
	 * The Register can be OPENED or CLOSED. It is NEW when created, before being opened or closed.
	 *
	 * @type {Number}
	 */
	state = STATES.NEW;
	/**
	 * Employee in charge of this Register.
	 *
	 * @type {String}
	 */
	employee = '';
	/**
	 * Data of the opening:
	 * - openedAt (Date): when it was opened
	 * - declaredCash (Decimal): amount of cash in the register
	 *
	 * @type {Object}
	 */
	openingData = {
		openedAt: null,
		declaredCash: null,
	};
	/**
	 * Data of the closing:
	 * - closedAt (Date): when it was closed
	 * - declaredCash (Decimal): amount of cash in the register
	 * - POSTRef (String): reference number of the POST batch
	 * - POSTAmount (Decimal): total amount of the POST batch
	 *
	 * @type {Object}
	 */
	closingData = {
		closedAt: null,
		declaredCash: null,
		POSTRef: null,
		POSTAmount: null,
	};
	/**
	 * List of cash movements
	 *
	 * @type {Array<CashMovement>}
	 */
	cashMovements = [];

	/**
	 * Opens the Register and saves opening data.
	 *
	 * @param {String} employee Employee's name
	 * @param {Decimal} cashAmount
	 */
	open(employee, cashAmount) {
		this.openingData = {
			declaredCash: cashAmount,
			openedAt: new Date(),
		};
		this.employee = employee;
		this.state = STATES.OPENED;
	}

	/**
	 * Sets the Register as closed and saves closing data.
	 *
	 * @param {Decimal} cashAmount
	 * @param {String} POSTRef POST batch reference number
	 * @param {Decimal} POSTAmount POST batch total
	 */
	close(cashAmount, POSTRef, POSTAmount) {
		this.closingData = {
			POSTRef,
			POSTAmount,
			declaredCash: cashAmount,
			closedAt: new Date(),
		};
		this.state = STATES.CLOSED;
	}

	/**
	 * For now, there is no need to store the transactions in the register since the app doesn't need
	 * to show them. We thus only set the Register on the Transaction.
	 *
	 * @param {Transaction} transaction
	 */
	addTransaction(transaction) {
		transaction.register = this;
	}

	/**
	 * Adds the CashMovement and sets its Register property.
	 *
	 * @param {CashMovement} cashMovement
	 */
	addCashMovement(cashMovement) {
		this.cashMovements.push(cashMovement);
		cashMovement.register = this;
	}
}

export default Register;
export const STATES = {
	NEW: 0,
	OPENED: 1,
	CLOSED: 2,
};
