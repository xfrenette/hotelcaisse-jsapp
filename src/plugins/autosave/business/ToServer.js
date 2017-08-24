import Plugin from '../../Plugin';

/**
 * Plugin that listens to modifications to the application's Business and calls methods on its
 * Server instance to save the modifications.
 */
class ToServer extends Plugin {
	id = 'autosave.business.toServer';
	/**
	 * Server instance
	 *
	 * @type {Server}
	 */
	server = null;

	constructor(server) {
		super();
		this.server = server;
	}

	/**
	 * When starting, start listening to events
	 */
	start() {
		this.registerListeners();
	}

	/**
	 * Registers all the listeners
	 */
	registerListeners() {
		this.listenOnNewOrder();
		this.listenOnOrderChange();
	}

	/**
	 * When a new Order is created.
	 */
	listenOnNewOrder() {
		this.application.business.on('newOrder', (order) => {
			this.server.orderCreated(order);
		});
	}

	/**
	 * When an Order is changed.
	 */
	listenOnOrderChange() {
		this.application.business.on('orderChange', (order, changes) => {
			this.server.orderChanged(order, changes);
		});
	}
}

export default ToServer;
