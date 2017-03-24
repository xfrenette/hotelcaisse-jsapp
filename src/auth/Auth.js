import { observable } from 'mobx';

/**
 * Class that handles device authentication. It must be extended (abstract).
 */
class Auth {
	/**
	 * If the device is authenticated
	 *
	 * @type {Bool}
	 */
	@observable
	authenticated = false;

	/**
	 * Tries to authenticate the device with the supplied credentials.
	 *
	 * @param {string} code Authentication code
	 * @param {string} deviceUUID Device UUID
	 * @return {Promise}
	 */
	// eslint-disable-next-line no-unused-vars
	authenticate(code, deviceUUID) {
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

