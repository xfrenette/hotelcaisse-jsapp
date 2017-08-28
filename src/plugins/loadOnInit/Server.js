import Plugin from '../Plugin';

/**
 * Plugin that tries to load a internal state of a Server object from its reader when the plugin
 * starts. If successful, updates the Server object . The start method will resolve once the loading
 * is finished, so it can be used to determine when the app loaded.
 */
class Server extends Plugin {
	id = 'loadOnInit.server';
	/**
	 * Reader where to read the Server
	 *
	 * @type {Reader}
	 */
	reader = null;
	/**
	 * Server instance to update
	 *
	 * @type {Server}
	 */
	server = null;

	constructor(reader, server) {
		super();
		this.reader = reader;
		this.server = server;
	}

	/**
	 * Reads from its reader. If an object is returned updates the server instance. Returns a
	 * Promise that resolves when everything is finished.
	 *
	 * @return {Promise}
	 */
	start() {
		return this.reader.read()
			.then((data) => {
				this.updateServer(data);
			});
	}

	/**
	 * Updates the server instance `data`.
	 *
	 * @param {object} data
	 */
	updateServer(data) {
		if (data === null || typeof data !== 'object') {
			return;
		}

		this.server.update(data);
	}
}

export default Server;
