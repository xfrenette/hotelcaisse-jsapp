import { serializable, list, object, date, identifier } from 'serializr';
import postal from 'postal';
import { observable } from 'mobx';
import { CHANNELS, TOPICS } from '../const/message-bus';
import CashMovement from './CashMovement';
import { decimal } from '../vendor/serializr/propSchemas';
import validate from '../Validator';

/**
 * All messages by this class are published on the same channel.
 *
 * @type {ChannelDefinition}
 */
const channel = postal.channel(CHANNELS.register);

/**
 * Constraints on the values when opening
 *
 * @type {Object}
 */
const openConstraints = {
	employee: {
		presence: true,
		typeOf: 'string',
	},
	cashAmount: {
		presence: true,
		decimal: { gte: 0 },
	},
};
/**
 * Constraints on the values when closing
 *
 * @type {Object}
 */
const closeConstraints = {
	cashAmount: {
		presence: true,
		decimal: { gte: 0 },
	},
	POSTRef: {
		presence: true,
		typeOf: 'string',
	},
	POSTAmount: {
		presence: true,
		decimal: { gte: 0 },
	},
};

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
	@observable
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
	@observable
	cashMovements = [];

	/**
	 * Opens the Register and saves opening data. The data will be validated before opening, but it
	 * will fail silently if validation fails, so do validation before with validateOpen().
	 *
	 * @param {String} employee Employee's name
	 * @param {Decimal} cashAmount
	 */
	open(employee, cashAmount) {
		const validationResult = this.validateOpen({ employee, cashAmount });

		if (typeof validationResult !== 'undefined') {
			return;
		}

		this.openingCash = cashAmount;
		this.openedAt = new Date();
		this.employee = employee;
		this.state = STATES.OPENED;

		channel.publish(TOPICS.register.opened, {
			register: this,
		});
	}

	/**
	 * Sets the Register as closed and saves closing data. The data will be validated before
	 * closing, but it will fail silently if validation fails, so do validation before with
	 * validateClose().
	 *
	 * @param {Decimal} cashAmount
	 * @param {String} POSTRef POST batch reference number
	 * @param {Decimal} POSTAmount POST batch total
	 */
	close(cashAmount, POSTRef, POSTAmount) {
		const validationResult = this.validateClose({ cashAmount, POSTRef, POSTAmount });

		if (typeof validationResult !== 'undefined') {
			return;
		}

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

	/**
	 * Validates values to open. Receives an object with employee and/or cashAmount keys. If the key
	 * is present, its value will be validated. If valid, returns undefined, else returns an object
	 * with keys of invalid values.
	 *
	 * @param {object} values (valid keys: employee, cashAmount)
	 * @return {mixed}
	 */
	validateOpen(values) {
		const constraints = {};
		Object.keys(values).forEach((key) => {
			const hasKey = Object.prototype.hasOwnProperty.call(openConstraints, key);
			if (hasKey) {
				constraints[key] = openConstraints[key];
			}
		});
		return validate(values, constraints);
	}

	/**
	 * Validates values to close. Receives an object with (one or many of) cashAmount, POSTRef,
	 * POSTAmount keys. If the key is present, its value will be validated. If valid, returns
	 * undefined, else returns an object with keys of invalid values.
	 *
	 * @param {Object} values (valid keys: cashAmount, employee, POSTAmount)
	 * @return {mixed}
	 */
	validateClose(values) {
		const constraints = {};
		Object.keys(values).forEach((key) => {
			const hasKey = Object.prototype.hasOwnProperty.call(closeConstraints, key);
			if (hasKey) {
				constraints[key] = closeConstraints[key];
			}
		});
		return validate(values, constraints);
	}
}

export default Register;
export const STATES = {
	NEW: 0,
	OPENED: 1,
	CLOSED: 2,
};
