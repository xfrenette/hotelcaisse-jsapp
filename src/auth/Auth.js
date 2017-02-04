import { observable } from 'mobx';

/**
 * Class that handles device authentification. It must be
 * extended (abstract)
 */
class Auth {
	@observable state = STATES.NON_INIT;
	@observable token = {
		value: null,
		expiresAt: null,
	};

	/**
	 * Sends authentification credentials (device id and
	 * authentication code) to the auth server. Returns a
	 * Promise object that resolves on authentication success
	 * and rejects on fail. If authentication successes, the
	 * state changes to VALID.
	 *
	 * @param {string} code Authentication code
	 * @return {Promise}
	 */
	authenticate(code) {
	}

	/**
	 * Returns an unique id identifying this device.
	 *
	 * @return {string}
	 */
	getDeviceId() {

	}

	/**
	 * Checks with the authentication server if the device is
	 * still authenticated. If so, updates the token with the
	 * informations returned, if not, changes the state to INVALID.
	 * Returns a Promise object that resolves when the request is
	 * done (even if the server returns an authentication error).
	 *
	 * @return {Promise}
	 */
	check() {

	}

	/**
	 * Reads data from source and, if a valid auth is found,
	 * sets its state to VALID and saves the token. Returns a
	 * Promise when finished.
	 *
	 * @param {DataSource} source
	 * @return {Promise}
	 */
	initFromSource(source) {
		/*
		return source.read().then(data, => {
			this.setData(data)
		})
		 */
	}

	/**
	 * Sets internal data from the supplied object
	 *
	 * @param {object} data
	 */
	setData(data) {

	}

	/**
	 * Returns an object representing this Auth. An Auth instance
	 * can be created by calling setData() with the data returned
	 * by this method.
	 *
	 * @return {object}
	 */
	getData() {

	}

	/**
	 * Returns the token to use for requests. If the current token
	 * is expired, contacts the auth server for a new token and
	 * returns it when done. Returns a Promise that resolves with
	 * the new token, or rejects if the server could not send a
	 * new token (device invalid, cannot connect, ...)
	 *
	 * @return {Promise}
	 */
	getToken() {
		/*
		if (this.isTokenExpired()) {
			return this.check()
				.then(return this.token)
		} else {
			return Promise.resolve(this.token)
		}
		 */
	}

	/**
	 * Returns true if the token is expired
	 *
	 * @return {Boolean}
	 */
	get isTokenExpired() {

	}
}

export default Auth;
export const STATES = {
	NON_INIT: 0,
	INVALID: 1,
	VALID: 2,
	EXPIRED: 3,
};
