import { serialize } from 'serializr';
import postal from 'postal';
import { CHANNELS, TOPICS } from '../../const/message-bus';
import DATA_CHANGE_TYPES from '../../const/data-change-types';
import Plugin from '../Plugin';
import DataChange from '../../DataChange';

/**
 * All messages useful for this class are published on the same channel.
 *
 * @type {ChannelDefinition}
 */
const channel = postal.channel(CHANNELS.register);

/**
 * Plugin that listens to messages sent by the Register and saves a DataChange object to the Writer.
 */
class RegisterUpdates extends Plugin {
	writer = null;

	/**
	 * @param {Writer} writer
	 */
	constructor(writer) {
		super();
		this.writer = writer;
	}

	/**
	 * When starting, subscribes to the messages.
	 */
	start() {
		this.subscribe();
	}

	/**
	 * Subscribes different functions to Register messages.
	 */
	subscribe() {
		channel.subscribe(TOPICS.register.opened, (data) => {
			this.registerOpened(data.register);
		});
		channel.subscribe(TOPICS.register.closed, (data) => {
			this.registerClosed(data.register);
		});
		channel.subscribe(TOPICS.register.cashMovement.added, (data) => {
			this.cashMovementAdded(data.cashMovement, data.register);
		});
		channel.subscribe(TOPICS.register.cashMovement.removed, (data) => {
			this.cashMovementRemoved(data.cashMovement, data.register);
		});
	}

	/**
	 * Called when the Register is opened. Writes a DataChange with the Register to the Writer.
	 *
	 * @param {Register} register
	 */
	registerOpened(register) {
		const dataChange = new DataChange(
			DATA_CHANGE_TYPES.register.opened,
			serialize(register)
		);
		this.writer.write(serialize(dataChange));
	}

	/**
	 * Called when the Register is closed. Writes a DataChange with the Register to the Writer.
	 *
	 * @param {Register} register
	 */
	registerClosed(register) {
		const dataChange = new DataChange(
			DATA_CHANGE_TYPES.register.closed,
			serialize(register)
		);
		this.writer.write(serialize(dataChange));
	}

	/**
	 * Called when a CashMovement is added to a Register. Writes a DataChange to the Writer with the
	 * CashMovement and the register's UUID
	 *
	 * @param {[type]} cashMovement
	 * @param {[type]} register
	 */
	cashMovementAdded(cashMovement, register) {
		const dataChange = new DataChange(
			DATA_CHANGE_TYPES.register.cashMovement.added,
			{
				registerUUID: register.uuid,
				cashMovement: serialize(cashMovement),
			}
		);
		this.writer.write(serialize(dataChange));
	}

	/**
	 * Called when a CashMovement is removed from a Register. Writes a DataChange to the Writer with
	 * the CashMovement and the register's UUID
	 *
	 * @param {[type]} cashMovement
	 * @param {[type]} register
	 */
	cashMovementRemoved(cashMovement, register) {
		const dataChange = new DataChange(
			DATA_CHANGE_TYPES.register.cashMovement.removed,
			{
				registerUUID: register.uuid,
				cashMovement: serialize(cashMovement),
			});
		this.writer.write(serialize(dataChange));
	}
}

export default RegisterUpdates;
