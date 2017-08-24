import Reader from '../Reader';

/**
 * Reader that its read() method returns the Register instance from the Server.
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
	 * Calls its Server instance's getRegister() and resolves with its value. If the
	 * server.getRegister() fails, resolves with null.
	 *
	 * @return {Promise}
	 */
	read() {
		return this.server.getRegister()
			.catch(() => null);
	}
}

export default Server;
