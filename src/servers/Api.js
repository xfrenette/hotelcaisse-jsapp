import { deserialize } from 'serializr';
import Server from './Server';
import Business from '../business/Business';
import Register from '../business/Register';

/**
 * Error codes that can be returned.
 *
 * @type {Object}
 */
const ERRORS = {
	SERVER_ERROR: 'server:error',
	NETWORK_ERROR: 'network:error',
	INVALID_RESPONSE: 'response:invalid',
	AUTH_FAILED: 'auth:failed',
	NOT_AUTH: 'request:notAuthenticated',
};

function createError(code, message) {
	return {
		code,
		message,
	};
}

class Api extends Server {
	/**
	 * Authentication class that wants to be controlled by the responses from the api. If set,
	 * its `authenticated` attribute will be set based on responses from the API.
	 *
	 * @type {Auth|null}
	 */
	auth = null;
	/**
	 * Base URL of the API.
	 *
	 * @type {string}
	 */
	url = null;
	/**
	 * Data version number received from the last request to the API.
	 *
	 * @type {string|null}
	 */
	lastDataVersion = null;
	/**
	 * Last authentication token received
	 *
	 * @type {string|null}
	 */
	token = null;
	/**
	 * Application instance. If set, its business and register will be updated when api response
	 * contain new data.
	 *
	 * @type {Application|null}
	 */
	application = null;

	/**
	 * @param {string} url API url
	 * @param {Application} application Application instance
	 */
	constructor(url, application = null) {
		super();
		this.url = url;
		this.application = application;
	}

	/**
	 * Returns true if an Auth instance is in `auth` and is authenticated.
	 *
	 * @returns {boolean}
	 */
	isAuthenticated() {
		return this.auth && this.auth.authenticated;
	}

	/**
	 * Queries the api at `path` with the specified `data`. Returns a Promise that resolves with
	 * the response's `data` value. Rejects if an error occured of if the response's `status` is
	 * not 'ok'. If `authenticated` is true (default value), it will first check if we are
	 * authenticated (rejects if not) and will include the last token in the request.
	 *
	 * @param {string} path
	 * @param {object} data
	 * @param {boolean} authenticated
	 * @returns {Promise}
	 */
	query(path, data = null, authenticated = true) {
		if (authenticated && !this.isAuthenticated()) {
			return Promise.reject(createError(
				ERRORS.NOT_AUTH,
				'This request can be made only if authenticated.'
			));
		}

		const body = this.buildRequestBody(data, authenticated);

		return this.requestApi(path, body)
			.then(Api.validateResponse)
			.then((responseData) => {
				this.processResponseMeta(responseData);
				this.processResponseBusiness(responseData);
				this.processResponseRegister(responseData);
				this.processResponseAuth(responseData);

				if (responseData.status !== 'ok') {
					return Promise.reject(Api.buildErrorObjectForResponse(responseData));
				}

				return responseData.data || null;
			});
	}

	/**
	 * Does the actual ajax request to the API with the `body`. The `body` will be converted to
	 * JSON. If the request fails, rejects with an error object. If the request succeeds, extracts
	 * the response's JSON object (if the response is not a JSON, rejects with an error object) and
	 * resolves with the response's body as a JS object.
	 *
	 * @param {string} path Relative path
	 * @param {object|null} body
	 * @returns {Promise}
	 */
	requestApi(path = '/', body = null) {
		const init = {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		};

		if (body !== null) {
			init.body = JSON.stringify(body);
		}

		const url = this.url + path;

		const resolved = response =>
			response.json()
				.catch(
					error => Promise.reject(createError(ERRORS.INVALID_RESPONSE, error.message))
				);

		const rejected = error => Promise.reject(createError(ERRORS.NETWORK_ERROR, error.message));

		return fetch(url, init)
			.then(resolved, rejected);
	}

	/**
	 * Returns an object containing the body to send to an Api POST request. Contains the `data` of
	 * the request, the last `dataVersion` received. If `authenticated` parameter is true (means we
	 * want to do an authenticated request), the `token` is added.
	 *
	 * @param {object} data
	 * @param {boolean} authenticated Set to true if this is an authenticated request
	 * @return {object}
	 */
	buildRequestBody(data = null, authenticated = true) {
		const body = {};

		if (data !== null) {
			body.data = data;
		}

		if (this.lastDataVersion !== null) {
			body.dataVersion = this.lastDataVersion;
		}

		if (authenticated && this.token !== null) {
			body.token = this.token;
		}

		return body;
	}

	/**
	 * Extracts some attributes from the response, if present.
	 * * token
	 * * dataVersion
	 *
	 * @param {object} data
	 */
	processResponseMeta(data) {
		if (data.token) {
			this.token = data.token;
		}

		if (data.dataVersion) {
			this.lastDataVersion = data.dataVersion;
		}
	}

	/**
	 * If the data has a `business` attribute, tries to deserialize it. If successful, updates
	 * the application's business instance. Note that if the deserialization fails, this method
	 * fails silently since it is not as important as the data of the response.
	 *
	 * @param {object} data
	 */
	processResponseBusiness(data) {
		if (!data.business || !this.application) {
			return;
		}

		try {
			const business = deserialize(Business, data.business);
			this.application.business.update(business);
		} catch (e) {
			// Do nothing
		}
	}

	/**
	 * If the data has a `register` attribute, tries to deserialize it. If successful, updates
	 * the application's register instance. Note that if the deserialization fails, this method
	 * fails silently since it is not as important as the data of the response.
	 *
	 * @param {object} data
	 */
	processResponseRegister(data) {
		if (!data.register || !this.application) {
			return;
		}

		try {
			const register = deserialize(Register, data.register);
			this.application.register.update(register);
		} catch (e) {
			// Do nothing
		}
	}

	/**
	 * If the response `data` contains an authentication error, 'log out' the `auth` instance.
	 * If it contains an authentication token, 'log in' the `auth` instance. Does nothing if no
	 * `auth` instance.
	 *
	 * @param {object} data
	 */
	processResponseAuth(data) {
		if (!this.auth) {
			return;
		}

		if (this.auth.authenticated) {
			if (data.error && data.error.code === ERRORS.AUTH_FAILED) {
				this.auth.authenticated = false;
			}
		} else if (data.token) {
			this.auth.authenticated = true;
		}
	}
}

/**
 * Validates that a response's body (`data`) is well formed (see below). Returns a Promise that
 * resolves with the same `data` if well formed, else it rejects with an error object.
 *
 * A well formed response object has a `status` with 'ok' or 'error' value.
 *
 * @param {object} data
 * @returns {Promise}
 */
Api.validateResponse = (data) => {
	if (data.status !== 'ok' && data.status !== 'error') {
		return Promise.reject(createError(
			ERRORS.INVALID_RESPONSE,
			'Response object is not well formed.'
		));
	}

	return Promise.resolve(data);
};

/**
 * Returns an error object with a code and message set from the response data.
 *
 * @param {object} data
 * @returns {object}
 */
Api.buildErrorObjectForResponse = (data) => {
	const code = data.error ? data.error.code : ERRORS.SERVER_ERROR;
	const message = data.error && data.error.message ? data.error.message : '';

	return createError(code, message);
};

export default Api;
export { ERRORS };
