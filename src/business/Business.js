import { list, object, serializable } from 'serializr';
import { observable, observe } from 'mobx';
import EventEmitter from 'events';
import postal from 'postal';
import { CHANNELS, TOPICS } from '../const/message-bus';
import Product from './Product';
import ProductCategory from './ProductCategory';
import TransactionMode from './TransactionMode';
import Order from './Order';
import Room from './Room';
import { field } from '../vendor/serializr/propSchemas';

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
 * - Rooms
 * - Accepted transaction modes
 * - ...
 */
class Business extends EventEmitter {
	/**
	 * List of all *currently* active Product of the business. Top level products only (variants
	 * are inside each product).
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
	@observable
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

	constructor() {
		super();
		this.listenToOrders();

		/*
		 * We create a special register function for the order change since we want to be able to
		 * easily remove it if the order is removed.
		 */
		const business = this;
		this.orderChangeListener = function (changes) {
			const order = this;
			business.onOrderChange.call(business, order, changes);
		};
	}

	/**
	 * Any time an Order is added or removed, we add or remove listeners on it.
	 */
	listenToOrders() {
		observe(this.orders, ({ type, added, removed }) => {
			// We don't allow replacing of orders, only adding or removing, so we only check for the
			// 'splice' type, and not the 'update' type
			if (type !== 'splice') {
				return;
			}

			if (Array.isArray(added)) {
				added.forEach(newOrder => this.listenToOrder(newOrder));
			}

			if (Array.isArray(removed)) {
				removed.forEach(oldOrder => this.clearOrderListeners(oldOrder));
			}
		});
	}

	/**
	 * Adds listeners to the order
	 *
	 * @param {Order} order
	 */
	listenToOrder(order) {
		order.on('change', this.orderChangeListener);
	}

	/**
	 * Removes listeners on the Order
	 *
	 * @param {Order} order
	 */
	clearOrderListeners(order) {
		order.removeListener('change', this.orderChangeListener);
	}

	/**
	 * When an Order changes, emit the 'orderChange' event with the Order and its changes.
	 *
	 * @param {Order} order
	 * @param {OrderChanges} changes
	 */
	onOrderChange(order, changes) {
		this.emit('orderChange', order, changes);
	}

	/**
	 * Add an Order to the order list. Emits a newOrder event.
	 *
	 * @param {Order} order
	 */
	addOrder(order) {
		this.orders.push(order);

		this.emit('newOrder', order);

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
			'products',
			'rootProductCategory',
			'transactionModes',
			'customerFields',
			'roomSelectionFields',
			'rooms',
		].forEach((attribute) => {
			this[attribute] = newBusiness[attribute];
		});

		// Special case for the orders, since they are observable
		if (newBusiness.orders) {
			this.orders.replace(newBusiness.orders);
		}
	}
}

export default Business;
