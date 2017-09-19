import { identifier, list, object, serializable } from 'serializr';
import EventEmiter from 'events';
import postal from 'postal';
import { observable } from 'mobx';
import { CHANNELS, TOPICS } from '../const/message-bus';
import CashMovement from './CashMovement';
import { decimal, timestamp } from '../vendor/serializr/propSchemas';
import validate from '../Validator';
import utils from '../utils';

/**
 * All messages by this class are published on the same channel.
 *
 * @type {ChannelDefinition}
 */
const channel = postal.channel(CHANNELS.register);

const STATES = {
	CLOSED: 0,
	OPENED: 1,
	UNINITIALIZED: 2,
};

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
class Register extends EventEmiter {
	/**
	 * UUID of the register
	 *
	 * @type {String}
	 */
	@serializable(identifier())
	uuid = null;
	/**
	 * The Register can be OPENED or CLOSED. It is UNINITIALIZED when created, before being opened
	 * or closed.
	 *
	 * @type {Number}
	 */
	@serializable
	@observable
	state = STATES.UNINITIALIZED;
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
	@serializable(timestamp())
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
	@serializable(timestamp())
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
	 * will fail silently if validation fails, so do validation before with validateOpen(). Emits a
	 * 'open' message when successfully opened.
	 *
	 * @param {String} employee Employee's name
	 * @param {Decimal} cashAmount
	 */
	open(employee, cashAmount) {
		const validationResult = Register.validateOpen({ employee, cashAmount });

		if (typeof validationResult !== 'undefined') {
			return;
		}

		this.openingCash = cashAmount;
		this.openedAt = new Date();
		this.employee = employee;
		this.state = STATES.OPENED;

		this.emit('open');

		channel.publish(TOPICS.register.opened, {
			register: this,
		});
	}

	/**
	 * Sets the Register as closed and saves closing data. The data will be validated before
	 * closing, but it will fail silently if validation fails, so do validation before with
	 * validateClose(). Emits a 'close' message when successfully closed.
	 *
	 * @param {Decimal} cashAmount
	 * @param {String} POSTRef POST batch reference number
	 * @param {Decimal} POSTAmount POST batch total
	 */
	close(cashAmount, POSTRef, POSTAmount) {
		const validationResult = Register.validateClose({ cashAmount, POSTRef, POSTAmount });

		if (typeof validationResult !== 'undefined') {
			return;
		}

		this.POSTRef = POSTRef;
		this.POSTAmount = POSTAmount;
		this.closingCash = cashAmount;
		this.closedAt = new Date();
		this.state = STATES.CLOSED;

		this.emit('close');

		channel.publish(TOPICS.register.closed, {
			register: this,
		});
	}

	/**
	 * Updates all the attributes of this Register with the values of `newRegister`. Trigger the
	 * 'update' event when done.
	 *
	 * @param newRegister
	 */
	update(newRegister) {
		const attributes = [
			'state',
			'uuid',
			'employee',
			'openedAt',
			'openingCash',
			'closedAt',
			'closingCash',
			'POSTRef',
			'POSTAmount',
		];

		attributes.forEach((attr) => { this[attr] = newRegister[attr]; });

		// cashMovements is observable
		this.cashMovements.replace(newRegister.cashMovements);
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
	 * Adds the CashMovement and sets its Register property. Emits a 'cashMovementAdd' event with the
	 * CashMovement.
	 *
	 * @param {CashMovement} cashMovement
	 */
	addCashMovement(cashMovement) {
		this.cashMovements.push(cashMovement);
		cashMovement.register = this;

		this.emit('cashMovementAdd', cashMovement);

		channel.publish(TOPICS.register.cashMovement.added, {
			cashMovement,
			register: this,
		});
	}

	/**
	 * Removes the CashMovement and clear its Register property. Emits a 'cashMovementRemove' event
	 * with the CashMovement. Note that the event will be emitted even if the CashMovement was not
	 * in the Register.
	 *
	 * @param {CashMovement} cashMovement
	 */
	removeCashMovement(cashMovement) {
		this.cashMovements.remove(cashMovement);
		cashMovement.register = null;

		this.emit('cashMovementRemove', cashMovement);

		channel.publish(TOPICS.register.cashMovement.removed, {
			cashMovement,
			register: this,
		});
	}
}

/**
 * Validates values to open. Receives an object with employee and/or cashAmount keys. If the key
 * is present, its value will be validated. If valid, returns undefined, else returns an object
 * with keys of invalid values.
 *
 * @param {object} values (valid keys: employee, cashAmount)
 * @return {mixed}
 */
Register.validateOpen = (values) => {
	const constraints = utils.getConstraintsFor(openConstraints, values);
	return validate(values, constraints);
};

/**
 * Validates values to close. Receives an object with (one or many of) cashAmount, POSTRef,
 * POSTAmount keys. If the key is present, its value will be validated. If valid, returns
 * undefined, else returns an object with keys of invalid values.
 *
 * @param {Object} values (valid keys: cashAmount, employee, POSTAmount)
 * @return {mixed}
 */
Register.validateClose = (values) => {
	const constraints = utils.getConstraintsFor(closeConstraints, values);
	return validate(values, constraints);
};

export default Register;
export { STATES };
