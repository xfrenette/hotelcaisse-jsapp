import { serialize } from 'serializr';
import postal from 'postal';
import { CHANNELS, TOPICS } from '../../const/message-bus';
import DATA_CHANGE_TYPES from '../../const/data-change-types';
import Plugin from '../Plugin';
import DataChange from '../../DataChange';

/**
 * All messages useful for this class are published on two main channels.
 *
 * @type {ChannelDefinition}
 */
const businessChannel = postal.channel(CHANNELS.business);
const orderChannel = postal.channel(CHANNELS.order);

/**
 * Plugin that listens to messages concerning Order (new orders and modifications) and saves a
 * DataChange object to the Writer.
 */
class OrderUpdates extends Plugin {
	writer = null;
	id = 'autosave-orderupdates';

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
	 * Subscribes different functions to Order messages.
	 */
	subscribe() {
		businessChannel.subscribe(TOPICS.business.order.added, (data) => {
			this.orderAdded(data.order);
		});
		orderChannel.subscribe(TOPICS.order.modified, (data) => {
			this.orderModified(data.order, data.changes);
		});
	}

	/**
	 * Called when a new Order is added to Business. Writes a DataChange with the new Order to the
	 * Writer.
	 *
	 * @param {Order} order
	 */
	orderAdded(order) {
		const dataChange = new DataChange(
			DATA_CHANGE_TYPES.business.order.added,
			serialize(order)
		);

		this.writer.write(serialize(dataChange));
	}

	/**
	 * Called when an Order is modified. Write a DataChange with the UUID of the Order and the
	 * OrderChanges representing the changes to the Writer.
	 *
	 * @param {Order} order
	 * @param {OrderChanges} changes
	 */
	orderModified(order, changes) {
		const dataChange = new DataChange(
			DATA_CHANGE_TYPES.order.modified,
			{
				orderUUID: order.uuid,
				changes: serialize(changes),
			}
		);

		this.writer.write(serialize(dataChange));
	}
}

export default OrderUpdates;
