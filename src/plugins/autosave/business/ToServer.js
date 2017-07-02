import Plugin from '../../Plugin';

/**
 * Plugin that listens to modifications to the application's Business (and its Register instance)
 * and calls methods on its Server instance to save the modifications.
 */
class ToServer extends Plugin {
	id = 'autosave.business.toServer';
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
		this.listenOnRegisterOpen();
		this.listenOnRegisterClose();
		this.listenOnCashMovementAdd();
		this.listenOnCashMovementRemove();
		this.listenOnNewOrder();
	}

	/**
	 * When the business.deviceRegister is opened, call server.registerOpened
	 */
	listenOnRegisterOpen() {
		this.application.business.on('registerOpen', () => {
			this.server.registerOpened(this.application.business.deviceRegister);
		});
	}

	/**
	 * When the business.deviceRegister is closed, call server.registerClosed
	 */
	listenOnRegisterClose() {
		this.application.business.on('registerClose', () => {
			this.server.registerClosed(this.application.business.deviceRegister);
		});
	}

	/**
	 * When a CashMovement is added to the Register.
	 */
	listenOnCashMovementAdd() {
		this.application.business.on('cashMovementAdd', (cm) => {
			this.server.cashMovementAdded(cm);
		});
	}

	/**
	 * When a CashMovement is removed from the Register.
	 */
	listenOnCashMovementRemove() {
		this.application.business.on('cashMovementRemove', (cm) => {
			this.server.cashMovementRemoved(cm);
		});
	}

	/**
	 * When a new Order is created.
	 */
	listenOnNewOrder() {
		this.application.business.on('newOrder', (order) => {
			this.server.orderCreated(order);
		});
	}
}

export default ToServer;
