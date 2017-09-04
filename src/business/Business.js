import { list, object, serializable } from 'serializr';
import EventEmitter from 'events';
import Product from './Product';
import ProductCategory from './ProductCategory';
import TransactionMode from './TransactionMode';
import Room from './Room';
import { field } from '../vendor/serializr/propSchemas';

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
	 * When an new Order is created. For now, only emits an event.
	 *
	 * @param {Order} order
	 */
	orderCreated(order) {
		this.emit('newOrder', order);
	}

	/**
	 * When an existing Order is modified. For now, only emits an event.
	 *
	 * @param {Order} order
	 * @param {OrderChanges} changes
	 */
	orderChanged(order, changes) {
		this.emit('orderChange', order, changes);
	}

	/**
	 * Replaces all attributes of this instance with the values in the supplied Business
	 * instance. Triggers the 'update' event when done.
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

		this.emit('update');
	}
}

export default Business;
