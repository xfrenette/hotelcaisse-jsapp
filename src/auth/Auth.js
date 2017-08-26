import { observable } from 'mobx';

/**
 * Error codes when authenticate() rejects
 *
 * @type {Object}
 */
const ERRORS = {
	AUTHENTICATION_FAILED: 'auth:failed',
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
	 * Tries to authenticate the device with the supplied credentials. Returns a Promise that
	 * resolves if successful, else rejects. If successful, sets this.authenticated to true, else to
	 * false.
	 *
	 * @param {string} code Authentication code
	 * @return {Promise}
	 */
	// noinspection JSUnusedLocalSymbols
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
export { ERRORS };

