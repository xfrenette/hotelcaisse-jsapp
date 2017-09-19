import Plugin from '../Plugin';

/**
 * Plugin that listens to business and device update events from the Api server and updates
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
	 * Listen to `businessUpdate` and `deviceUpdate` events
	 */
	setupListeners() {
		this.server.on('businessUpdate', this.updateBusiness.bind(this));
		this.server.on('deviceUpdate', this.updateDevice.bind(this));
	}

	/**
	 * Updates the business instance of the application with the received business.
	 * @param {Business} business
	 */
	updateBusiness(business) {
		this.application.business.update(business);
	}

	/**
	 * Updates the device instance of the application with the received device.
	 * @param {Device} device
	 */
	updateDevice(device) {
		this.application.device.update(device);
	}
}

export default UpdatesListener;
