import Server from './Server';

/**
 * Error codes that can be returned.
 *
 * @type {Object}
 */
const ERRORS = {
	SERVER_ERROR: 0,
	NETWORK_ERROR: 1,
	INVALID_RESPONSE: 2,
	RESPONSE_ERROR: 3,
	NOT_AUTHENTICATED: 4,
};

function createError(code, message) {
	return {
		code,
		message,
	};
}

class Api extends Server {
	/**
	 * ApiWithToken authentication class that authenticated to the API.
	 *
	 * @type {ApiWithToken}
	 */
	apiAuth = null;
	/**
	 * Base URL of the API.
	 *
	 * @type {String}
	 */
	url = null;
	/**
	 * Data version number received from the last request to the API.
	 *
	 * @type {String}
	 */
	lastDataVersion = null;

	/**
	 * @param {String} url API url
	 * @param {ApiWithToken} apiAuth API Authentication class using token
	 */
	constructor(url, apiAuth) {
		super();
		this.url = url;
		this.apiAuth = apiAuth;
	}

	/**
	 * Queries the API. Returns a Promise. First ensures we are authenticated (else rejects).
	 *
	 * @see  doRequest
	 * @param {String} method
	 * @param {Object} data
	 * @param {String} path
	 * @return {Promise}
	 */
	query(method, data, path) {
		if (!this.apiAuth.authenticated) {
			const errorMessage = 'Not authenticated to the API.';
			return Promise.reject(createError(ERRORS.NOT_AUTHENTICATED, errorMessage));
		}

		return this.doRequest(method, data, path);
	}

	/**
	 * Does a fetch request to the api on the specified path with the specified data and method.
	 * Returns a Promise that resolves with the returned data on success, else rejects with an
	 * error.
	 *
	 * @param {string} method HTTP method
	 * @param {object} data
	 * @param {string} path
	 * @return {Promise}
	 */
	doRequest(method, data, path = null) {
		const fetchInit = {
			method,
			cache: 'no-cache',
		};

		if (method === 'POST') {
			fetchInit.body = this.buildRequestBody(data);
		}

		const urlParams = method === 'POST' ? null : data;
		const url = this.buildRequestURL(path, urlParams);

		return fetch(url, fetchInit)
			.catch(
				error => Promise.reject(createError(ERRORS.NETWORK_ERROR, error.message))
			)
			.then(response => (
				Api.validateResponse(response)
					.then(responseData => this.processResponseData(responseData))
			));
	}

	/**
	 * Returns the API URL where to send the request using the specified path. If the path is not
	 * supplied, returns the base url. If data is an object, it is used as GET params and added to
	 * the URL (note that path and base url must not already have params).
	 *
	 * @param {String} path
	 * @param {Object} params
	 * @return {String}
	 */
	buildRequestURL(path = false, params = null) {
		const url = path ? `${this.url}/${path}` : this.url;
		let urlParams = '';

		if (params) {
			urlParams = '?' + Object.entries(params).map(
				([key, val]) => `${key}=${encodeURIComponent(val)}`
			).join('&');
		}

		return `${url}${urlParams}`;
	}

	/**
	 * Returns a FormData prefilled with the data, but also with other required parameters, that can
	 * be used when making a POST fetch() request.
	 *
	 * @param {object} data
	 * @return {FormData}
	 */
	buildRequestBody(data) {
		const formData = new FormData();
		formData.set('data', JSON.stringify(data));
		formData.set('lastDataVersion', this.lastDataVersion);
		formData.set('token', this.apiAuth.token);
		return formData;
	}

	/**
	 * Processes data returned by the server. Returns Promise that resolves with data.data if the
	 * status is 'ok'. Else, rejects with an error containing the data.error object. Expects the
	 * data to be well formed (see Api.validateResponse). If a dataVersion is present, will update
	 * the lastDataVersion.
	 *
	 * @param {object} data
	 * @return {Promise}
	 */
	processResponseData(data) {
		if (data.dataVersion) {
			this.lastDataVersion = data.dataVersion;
		}

		if (data.status !== 'ok') {
			const error = createError(ERRORS.RESPONSE_ERROR);
			error.data = data.error;

			return Promise.reject(error);
		}

		return Promise.resolve(data.data || null);
	}
}

/**
 * Validates the Response and its data. Returns a Promise that resolves if the response is 'OK' and
 * it contains an expected json object. Else, the Promise reject with an error.
 *
 * @param {Response} response
 * @return {Promise}
 */
Api.validateResponse = (response) => {
	if (!response.ok) {
		const errorMessage = `Received response status ${response.status} ${response.statusText}`;
		return Promise.reject(createError(ERRORS.SERVER_ERROR, errorMessage));
	}

	return response.json()
		.then((data) => {
			if (!data.status) {
				const error = createError(ERRORS.INVALID_RESPONSE, 'Unexpected response received.');
				return Promise.reject(error);
			}

			return data;
		})
		.catch(() => {
			const error = createError(ERRORS.INVALID_RESPONSE, 'Response contains invalid JSON.');
			return Promise.reject(error);
		});
};

export default Api;
export { ERRORS };
