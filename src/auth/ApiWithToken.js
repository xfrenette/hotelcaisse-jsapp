import Auth, { ERRORS as AUTH_ERRORS } from './Auth';

/**
 * Error codes when authenticate() rejects
 *
 * @type {Object}
 */
const ERRORS = {
	SERVER_ERROR: 10,
	NETWORK_ERROR: 11,
	INVALID_RESPONSE: 12,
};

/**
 * Creates an error object containing a code and a message.
 *
 * @param {ERRORS} code
 * @param {String} message
 * @return {Object}
 */
function createError(code, message) {
	return {
		code,
		message,
	};
}

/**
 * Authentication class that uses a token to authenticate to the API.
 */
class ApiWithToken extends Auth {
	/**
	 * Token received with successful authentication
	 *
	 * @type {String}
	 */
	token = null;
	/**
	 * URL of the authentication API.
	 *
	 * @type {String}
	 */
	apiURL = null;

	constructor(apiURL) {
		super();
		this.apiURL = apiURL;
	}

	/**
	 * Does the authentication. Returns a Promise that resolves if successful, else rejects. If
	 * successful, sets this.authenticated to true, else to false.
	 *
	 * @param {string} code
	 * @param {string} deviceUUID
	 * @return {Promise}
	 */
	authenticate(code, deviceUUID) {
		this.invalidate();
		return this.doAuthenticateRequest(code, deviceUUID)
			.then(() => {
				this.authenticated = true;
			});
	}

	/**
	 * Invalidates the authentication and clears the token.
	 */
	invalidate() {
		super.invalidate();
		this.token = null;
	}

	/**
	 * Does the actual request to the API to authenticate with the code and device uuid and
	 * processes the response. Returns a Promise that resolves if authentication is successful,
	 * rejects if any problem (network error, authentication fail, ...).
	 *
	 * @param {String} code
	 * @param {String} deviceUUID
	 * @return {Promise}
	 */
	doAuthenticateRequest(code, deviceUUID) {
		const body = new FormData();
		body.append('code', code);
		body.append('deviceUUID', deviceUUID);
		const init = {
			body,
			method: 'POST',
			cache: 'no-cache',
		};

		return fetch(this.apiURL, init)
			.then(
				response => ApiWithToken.validateAPIResponse(response)
					.then(
						responseData => this.processResponseData(responseData)
					)
			)
			.catch(
				error => Promise.reject(createError(ERRORS.NETWORK_ERROR, error.message))
			);
	}

	/**
	 * Parses response data object and returns a Promise. If the data status is ok, the Promise
	 * resolves and the method sets the token. Else, the Promise rejects. This method assumes that
	 * the response data object is well formed (see ApiWithToken.validateAPIResponse)
	 *
	 * @param {object} responseData
	 * @return {Promise}
	 */
	processResponseData(responseData) {
		if (responseData.status === 'error') {
			const errorMessage = `Authentication failed with error ${responseData.error.code} ${responseData.error.message}`;
			return Promise.reject(createError(AUTH_ERRORS.AUTHENTICATION_FAILED, errorMessage));
		}

		this.token = responseData.data.token;

		return Promise.resolve();
	}
}

/**
 * Validates that the Response object received from the API contains valid data. Returns a Promise
 * that resolves with the response's data if valid, else rejects if the response code is not
 * 200-299 (ERRORS.SERVER_ERROR), if the JSON is invalid or doesn't contain expected fields
 * (ERRORS.INVALID_RESPONSE).
 *
 * @param {Response} response
 * @return {Promise}
 */
ApiWithToken.validateAPIResponse = (response) => {
	if (!response.ok) {
		const errorMessage = `Received response status ${response.status} ${response.statusText}`;
		return Promise.reject(createError(ERRORS.SERVER_ERROR, errorMessage));
	}

	return response.json()
		.then((data) => {
			if (!ApiWithToken.isResponseDataValid(data)) {
				const error = createError(ERRORS.INVALID_RESPONSE, 'Response data is not valid.');
				return Promise.reject(error);
			}

			return data;
		})
		.catch(() => {
			const error = createError(ERRORS.INVALID_RESPONSE, 'Response contains invalid JSON.');
			return Promise.reject(error);
		});
};

/**
 * Returns true if the response data object contains all required fields.
 *
 * @param {object} data
 * @return {Boolean}
 */
ApiWithToken.isResponseDataValid = (data) => {
	if (!data.status) return false;

	if (data.status === 'ok') {
		if (!data.data) return false;
		if (!data.data.token) return false;
	} else {
		if (!data.error) return false;
		if (!data.error.code) return false;
	}

	return true;
};

export default ApiWithToken;
export { ERRORS };
