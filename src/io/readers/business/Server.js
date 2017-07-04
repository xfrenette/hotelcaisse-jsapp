import Reader from '../Reader';

/**
 * Reader that its read() method returns the Business instance from the Server.
 */
class Server extends Reader {
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
	 * Calls its Server instance's getBusiness() and resolves with its value. If the
	 * server.getBusiness() fails, resolves with null.
	 *
	 * @return {Promise}
	 */
	read() {
		return this.server.getBusiness()
			.catch(() => null);
	}
}

export default Server;
