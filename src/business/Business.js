import { serializable, object, list, identifier } from 'serializr';
import { observable } from 'mobx';
import postal from 'postal';
import { CHANNELS, TOPICS } from '../const/message-bus';
import Register from './Register';
import Product from './Product';
import ProductCategory from './ProductCategory';
import TransactionMode from './TransactionMode';
import Order from './Order';
import Room from './Room';
import { rawObject, field } from '../vendor/serializr/propSchemas';

/**
 * All messages by this class are published on the same channel.
 *
 * @type {ChannelDefinition}
 */
const channel = postal.channel(CHANNELS.business);

/**
 * Class that represents the business currently on this device and all its business related data.
 * Examples:
 * - Products and product categories
 * - Register assigned to the device
 * - Accepted transaction modes
 * - ...
 */
class Business {
	/**
	 * UUID of the Business. The app cannot create new Business, so the UUID will either be null (not
	 * yet associated with the server) or a UUID returned by the server.
	 *
	 * @type {String}
	 */
	@serializable(identifier())
	uuid = null;
	/**
	 * Register currently assigned to this device.
	 *
	 * @type {Register}
	 */
	@serializable(object(Register))
	@observable
	deviceRegister = null;
	/**
	 * List of all *currently* active Product of the business.
	 *
	 * @type {Array<Product>}
	 */
	@serializable(list(object(Product)))
	products = [];
	/**
	 * Root ProductCategory containing all the products and other sub-categories. All products in
	 * this or sub category are guaranteed to be in the products array above.
	 *
	 * @type {ProductCategory}
	 */
	@serializable(object(ProductCategory))
	rootProductCategory = null;
	/**
	 * List of *currently* accepted transaction modes.
	 *
	 * @type {Array<TransactionMode>}
	 */
	@serializable(list(object(TransactionMode)))
	transactionModes = [];
	/**
	 * List of Orders. Note that this array contains only a subset to ease retrieval of recent
	 * Orders, it does not contain ALL the Orders.
	 *
	 * @type {Array<Order>}
	 */
	@serializable(list(object(Order)))
	orders = [];
	/**
	 * List of Field for the Customer fields.
	 *
	 * @type {Array<Field>}
	 */
	@serializable(list(field()))
	customerFields = [];
	/**
	 * List of Field for the RoomSelection fields.
	 *
	 * @type {Array<Field>}
	 */
	@serializable(list(field()))
	roomSelectionFields = [];
	/**
	 * All the rooms
	 *
	 * @type {Array<Room>}
	 */
	@serializable(list(object(Room)))
	rooms = [];

	/**
	 * Add an Order to the order list. Publishes a message.
	 *
	 * @param {Order} order
	 */
	addOrder(order) {
		this.orders.push(order);

		channel.publish(TOPICS.business.order.added, {
			order,
			business: this,
		});
	}

	/**
	 * Replaces all attributes of this instance with the values in the supplied Business instance.
	 *
	 * @param {Business} newBusiness
	 */
	update(newBusiness) {
		[
			'uuid',
			'deviceRegister',
			'products',
			'rootProductCategory',
			'transactionModes',
			'orders',
			'customerFields',
			'roomSelectionFields',
			'rooms',
		].forEach((attribute) => {
			this[attribute] = newBusiness[attribute];
		});
	}
}

export default Business;
