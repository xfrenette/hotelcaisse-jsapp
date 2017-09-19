import Plugin from '../../Plugin';

/**
 * Plugin that listens to modifications to the application's Device and calls methods on its
 * Server instance to save the modifications.
 */
class ToServer extends Plugin {
	id = 'autosave.device.toServer';
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
	 * Registers all the listeners on the Device's
	 */
	registerListeners() {
		this.listenOnRegisterOpen();
		this.listenOnRegisterClose();
		this.listenOnCashMovementAdd();
		this.listenOnCashMovementRemove();
	}

	/**
	 * When the register is opened, call server.registerOpened
	 */
	listenOnRegisterOpen() {
		this.application.register.on('open', () => {
			this.server.registerOpened(this.application.register);
		});
	}

	/**
	 * When the register is closed, call server.registerClosed
	 */
	listenOnRegisterClose() {
		this.application.register.on('close', () => {
			this.server.registerClosed(this.application.register);
		});
	}

	/**
	 * When a CashMovement is added to the Register.
	 */
	listenOnCashMovementAdd() {
		this.application.register.on('cashMovementAdd', (cm) => {
			this.server.cashMovementAdded(cm);
		});
	}

	/**
	 * When a CashMovement is removed from the Register.
	 */
	listenOnCashMovementRemove() {
		this.application.register.on('cashMovementRemove', (cm) => {
			this.server.cashMovementRemoved(cm);
		});
	}
}

export default ToServer;
