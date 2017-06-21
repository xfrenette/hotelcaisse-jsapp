/**
 * A Server class represents an external entity that can return data for the Application, that can
 * save data or that can execute actions the Application itself cannot do (ex: send emails). This
 * instance does nothing and should be implemented.
 */
class Server {
	/**
	 * Returns [quantity] Orders following the [from] Order. It is the Server that determines the order
	 * of the Orders. Returns an Promise that resolves with an array of Order.
	 *
	 * @param {Order} from
	 * @param {Number} quantity
	 * @return {Promise}
	 */
	getOrders(from, quantity) {
		return Promise.resolve([]);
	}
}

export default Server;
