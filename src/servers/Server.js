/**
 * A Server class represents an external entity that can return data for the Application, that can
 * save data or that can execute actions the Application itself cannot do (ex: send emails). This
 * instance does nothing and should be implemented.
 */
class Server {
	/**
	 * Returns the next [quantity] Orders following the [from] Order. It is the Server that
	 * determines the order of the Orders. Returns an Promise that resolves with an array of Order.
	 *
	 * @param {Order} from
	 * @param {Number} quantity
	 * @return {Promise}
	 */
	nextOrders(from, quantity) {
		return Promise.resolve([]);
	}

	/**
	 * When the register was opened
	 *
	 * @param {Register} register
	 */
	registerOpened(register) { }

	/**
	 * When the register was closed
	 *
	 * @param {Register} register
	 */
	registerClosed(register) { }

	/**
	 * When a CashMovement is added to the Register
	 *
	 * @param {cashMovement} cashMovement
	 */
	cashMovementAdded(cashMovement) { }

	/**
	 * When a CashMovement is removed from the Register
	 *
	 * @param {cashMovement} cashMovement
	 */
	cashMovementRemoved(cashMovement) { }

	/**
	 * When a new Order is created
	 *
	 * @param {Order} order
	 */
	orderCreated(order) { }

	/**
	 * When an Order was changed.
	 *
	 * @param {Order} order
	 * @param {OrderChanges} changes
	 */
	orderChanged(order, changes) { }
}

export default Server;
