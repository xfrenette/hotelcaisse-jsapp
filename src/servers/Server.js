/* eslint-disable no-unused-vars */
/**
 * A Server class represents an external entity that can return data for the Application, that can
 * save data or that can execute actions the Application itself cannot do (ex: send emails). This
 * instance does nothing and should be implemented.
 */
class Server {
	/**
	 * Returns a Promise that resolves with the Business instance that is currently on the server.
	 *
	 * @return {Promise.<Business>}
	 */
	getBusiness() {
		return Promise.resolve(null);
	}

	/**
	 * Returns a Promise that resolves with the device's Register instance that is currently on the
	 * server.
	 *
	 * @return {Promise.<Register>}
	 */
	getRegister() {
		return Promise.resolve(null);
	}

	/**
	 * Returns a Promise that resolves with the next `quantity` Orders. If `from` is set, the
	 * orders following it are returned. It is the Server that determines the order of the Orders.
	 *
	 * @param {Number} quantity
	 * @param {Order} from
	 * @return {Promise.<Array<Order>>}
	 */
	nextOrders(quantity, from = null) {
		return Promise.resolve([]);
	}

	/**
	 * When the register is opened.
	 *
	 * @param {Register} register
	 * @return {Promise}
	 */
	registerOpened(register) {
		return Promise.resolve();
	}

	/**
	 * When the register is closed.
	 *
	 * @param {Register} register
	 * @return {Promise}
	 */
	registerClosed(register) {
		return Promise.resolve();
	}

	/**
	 * When a CashMovement is added to the Register
	 *
	 * @param {cashMovement} cashMovement
	 * @return {Promise}
	 */
	cashMovementAdded(cashMovement) {
		return Promise.resolve();
	}

	/**
	 * When a CashMovement is removed from the Register
	 *
	 * @param {cashMovement} cashMovement
	 * @return {Promise}
	 */
	cashMovementRemoved(cashMovement) {
		return Promise.resolve();
	}

	/**
	 * When a new Order is created
	 *
	 * @param {Order} order
	 * @return {Promise}
	 */
	orderCreated(order) {
		return Promise.resolve();
	}

	/**
	 * When an Order was changed, receives the OrderChanges.
	 *
	 * @param {Order} order
	 * @param {OrderChanges} changes
	 * @return {Promise}
	 */
	orderChanged(order, changes) {
		return Promise.resolve();
	}
}

export default Server;
