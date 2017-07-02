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
		this.listenOnRegisterOpened();
		this.listenOnRegisterClosed();
	}

	/**
	 * When the business.deviceRegister is opened, call server.registerOpened
	 */
	listenOnRegisterOpened() {
		this.application.business.on('registerOpen', () => {
			this.server.registerOpened(this.application.business.deviceRegister);
		});
	}

	/**
	 * When the business.deviceRegister is closed, call server.registerClosed
	 */
	listenOnRegisterClosed() {
		this.application.business.on('registerClose', () => {
			this.server.registerClosed(this.application.business.deviceRegister);
		});
	}
}

export default ToServer;
