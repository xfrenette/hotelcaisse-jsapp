import Plugin from '../Plugin';

/**
 * Plugin that listens to business and register update events from the Api server and updates
 * the data on the application instance.
 */
class UpdatesListener extends Plugin {
	/**
	 * Unique id of this plugin
	 *
	 * @type {String}
	 */
	id = 'apiServer.updatesListener';
	/**
	 * Api server instance
	 * @type {Api}
	 */
	server = null;

	constructor(server) {
		super();
		this.server = server;
	}

	/**
	 * On start, setup the listeners
	 */
	start() {
		this.setupListeners();
	}

	/**
	 * Listen to `businessUpdate` and `registerUpdate` events
	 */
	setupListeners() {
		this.server.on('businessUpdate', this.updateBusiness.bind(this));
		this.server.on('registerUpdate', this.updateRegister.bind(this));
	}

	/**
	 * Updates the business instance of the application with the received business.
	 * @param {Business} business
	 */
	updateBusiness(business) {
		this.application.business.update(business);
	}

	/**
	 * Updates the register instance of the application with the received register.
	 * @param {Register} register
	 */
	updateRegister(register) {
		this.application.register.update(register);
	}
}

export default UpdatesListener;
