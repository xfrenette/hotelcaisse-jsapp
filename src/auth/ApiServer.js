import Auth from './Auth';

/**
 * Authentication class that uses a servers/API instance. This class can be considered more like
 * a 'facade' in front of the server instance. This auth class just redirects the requests to
 * the server, and it is the server that sets this instance's `authenticated` attribute.
 */
class ApiServer extends Auth {
	/**
	 * Api (in servers/) instance
	 *
	 * @type {Api}
	 */
	server = null;

	constructor(server) {
		super();
		this.server = server;
		this.server.auth = this;
	}

	/**
	 * Does the authentication with the server.
	 *
	 * @param {string} code
	 * @return {Promise}
	 */
	authenticate(code) {
		this.invalidate();
		return this.server.linkDevice(code);
	}
}

export default ApiServer;
