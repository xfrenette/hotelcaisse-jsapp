/**
 * Class that handles device authentication. It must be extended (abstract).
 */
class Auth {
	/**
	 * If the device is authenticated
	 *
	 * @type {Bool}
	 */
	authenticated = false;
	/**
	 * Device UUID used when authenticating.
	 *
	 * @type {String}
	 */
	deviceUUID = '';

	/**
	 * Tries to authenticate the device with the supplied code.
	 *
	 * @param {string} code Authentication code
	 * @return {Promise}
	 */
	// eslint-disable-next-line no-unused-vars
	authenticate(code) {
		return Promise.reject();
	}

	/**
	 * Marks the device to not authenticated.
	 */
	invalidate() {
		this.authenticated = false;
	}
}

export default Auth;

