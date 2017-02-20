import { serializable, list, object, date, identifier } from 'serializr';
import postal from 'postal';
import { CHANNELS, TOPICS } from '../const/message-bus';
import CashMovement from './CashMovement';
import { decimal } from '../vendor/serializr/propSchemas';

/**
 * All messages by this class are published on the same channel.
 *
 * @type {ChannelDefinition}
 */
const channel = postal.channel(CHANNELS.register);

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
	 * UUID of the register
	 *
	 * @type {String}
	 */
	@serializable(identifier())
	uuid = 'TODO';
	/**
	 * The Register can be OPENED or CLOSED. It is NEW when created, before being opened or closed.
	 *
	 * @type {Number}
	 */
	@serializable
	state = STATES.NEW;
	/**
	 * Employee in charge of this Register.
	 *
	 * @type {String}
	 */
	@serializable
	employee = '';
	/**
	 * Date time the register was opened.
	 *
	 * @type {Date}
	 */
	@serializable(date())
	openedAt = null;
	/**
	 * Amount of cash when the register was opened.
	 *
	 * @type {Decimal}
	 */
	@serializable(decimal())
	openingCash = null;
	/**
	 * Date time the register was closed.
	 *
	 * @type {Date}
	 */
	@serializable(date())
	closedAt = null;
	/**
	 * Amount of cash when the register was closed.
	 *
	 * @type {Decimal}
	 */
	@serializable(decimal())
	closingCash = null;
	/**
	 * POST batch number (when closing batch).
	 *
	 * @type {String}
	 */
	@serializable
	POSTRef = null;
	/**
	 * POST batch total (when closing batch).
	 *
	 * @type {Decimal}
	 */
	@serializable(decimal())
	POSTAmount = null;
	/**
	 * List of cash movements
	 *
	 * @type {Array<CashMovement>}
	 */
	@serializable(list(object(CashMovement)))
	cashMovements = [];

	/**
	 * Opens the Register and saves opening data.
	 *
	 * @param {String} employee Employee's name
	 * @param {Decimal} cashAmount
	 */
	open(employee, cashAmount) {
		this.openingCash = cashAmount;
		this.openedAt = new Date();
		this.employee = employee;
		this.state = STATES.OPENED;

		channel.publish(TOPICS.register.opened, {
			register: this,
		});
	}

	/**
	 * Sets the Register as closed and saves closing data.
	 *
	 * @param {Decimal} cashAmount
	 * @param {String} POSTRef POST batch reference number
	 * @param {Decimal} POSTAmount POST batch total
	 */
	close(cashAmount, POSTRef, POSTAmount) {
		this.POSTRef = POSTRef;
		this.POSTAmount = POSTAmount;
		this.closingCash = cashAmount;
		this.closedAt = new Date();
		this.state = STATES.CLOSED;

		channel.publish(TOPICS.register.closed, {
			register: this,
		});
	}

	/**
	 * For now, there is no need to store the transactions in the register since the app doesn't need
	 * to show them. We thus only set the Register on the Transaction. For the same reason, we do not
	 * publish a message on postal.
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

		channel.publish(TOPICS.register.cashMovement.added, {
			cashMovement,
			register: this,
		});
	}

	removeCashMovement(cashMovement) {
		this.cashMovements = this.cashMovements.filter(
			element => element !== cashMovement
		);

		cashMovement.register = null;

		channel.publish(TOPICS.register.cashMovement.removed, {
			cashMovement,
			register: this,
		});
	}
}

export default Register;
export const STATES = {
	NEW: 0,
	OPENED: 1,
	CLOSED: 2,
};
