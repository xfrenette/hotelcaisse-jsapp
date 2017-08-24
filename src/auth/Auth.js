import { observable } from 'mobx';

/**
 * Error codes when authenticate() rejects
 *
 * @type {Object}
 */
const ERRORS = {
	AUTHENTICATION_FAILED: 1,
};

/**
 * Class that handles device authentication. It must be extended (abstract). This specific
 * implementation must refuse any authentication.
 */
class Auth {
	/**
	 * If the device is authenticated
	 *
	 * @type {boolean}
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
	// noinspection JSUnusedLocalSymbols
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
export { ERRORS };

