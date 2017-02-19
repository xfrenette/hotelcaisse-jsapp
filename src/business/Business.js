import { serializable, object, list } from 'serializr';
import Register from './Register';
import Product from './Product';
import ProductCategory from './ProductCategory';
import TransactionMode from './TransactionMode';
import Order from './Order';

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
	 * Register currently assigned to this device.
	 *
	 * @type {Register}
	 */
	@serializable(object(Register));
	deviceRegister = null;
	/**
	 * List of all *currently* active Product of the business.
	 *
	 * @type {Array<Product>}
	 */
	@serializable(list(object(Product)))
	products = [];
	/**
	 * List of all *currently* active product categories. All the Product referenced by the
	 * ProductCategory are also present in the products array above.
	 *
	 * @type {Array<ProductCategory>}
	 */
	@serializable(list(object(ProductCategory)))
	productCategories = [];
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
	 * TODO
	 * Tries to initialize from data in a list of sources. Will try to load the data from each
	 * source in order. If a source returns valid data, it saves it and stops there, else it
	 * continues to the next. At the end (even if no sources contained valid data), sets the state
	 * to INITIALIZED. Returns a Promise that resolves when initializing finishes
	 *
	 * @param {Array<DataSource>} sources
	 * @return {Promise}
	 */
	initFromSources(sources) {
		/*
		return new Promise(
			sources.forEach(source => {
				source.read().then(data => {
					if (data) {
						this.setData(data);
						break;
					}
				}
			})
		).then(this.initialize())
		 */
	}
}

export default Business;
