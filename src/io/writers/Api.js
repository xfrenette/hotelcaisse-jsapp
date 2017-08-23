import postal from 'postal';
import { CHANNELS, TOPICS } from '../../const/message-bus';
import Writer from './Writer';

/**
 * All messages by this class are published on the same channel.
 *
 * @type {ChannelDefinition}
 */
const pubChannel = postal.channel(CHANNELS.api);

/**
 * Error codes returned when the Promise of write() rejects.
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

class Api extends Writer {
	/**
	 * ApiWithToken authentication class that authenticated to the API.
	 *
	 * @type {ApiWithToken}
	 */
	apiAuth = null;
	/**
	 * Base URL of the API. When writing, if a channel is present, it will be added to the URL.
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
	 * Writes data to the API on the channel. Returns a Promise. Must be authenticated to the API
	 * (through the ApiWithToken class passed in the constructor()) else the Promise rejects. The
	 * Promise will resolve if a success response is received from the API, rejects in all other
	 * cases.
	 *
	 * @param {Object} data
	 * @param {String} channel
	 * @return {Promise}
	 */
	write(data, channel) {
		if (!this.apiAuth.authenticated) {
			const errorMessage = 'Not authenticated to the API.';
			return Promise.reject(createError(ERRORS.NOT_AUTHENTICATED, errorMessage));
		}

		return this.doRequest(data, channel);
	}

	/**
	 * Does a fetch request to the api on the specified channel with the specified data. Returns a
	 * Promise that resolves with the returned data on success, else rejects with an error.
	 *
	 * @param {object} data
	 * @param {string} channel
	 * @return {Promise}
	 */
	doRequest(data, channel) {
		const fetchInit = {
			method: 'POST',
			body: this.buildRequestBody(data),
			cache: 'no-cache',
		};

		return fetch(this.buildRequestURL(channel), fetchInit)
			.catch(
				error => Promise.reject(createError(ERRORS.NETWORK_ERROR, error.message))
			)
			.then(response => (
				Api.validateResponse(response)
					.then((responseData) => {
						const res = this.processResponseData(responseData);

						res
							.then((successData) => {
								Api.publishSuccessData(successData);
							})
							.catch((error) => {
								Api.publishErrorData(error.data);
							});

						return res;
					})
				)
			);
	}

	/**
	 * Returns the API URL when to send the request using the channel.
	 *
	 * @param {String} channel
	 * @return {String}
	 */
	buildRequestURL(channel) {
		return channel ? `${this.url}/${channel}` : this.url;
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

/**
 * Publishes a message with the data from a successful response.
 *
 * @param {Object} data
 */
Api.publishSuccessData = (data) => {
	pubChannel.publish(TOPICS.api.dataReceived.success, data);
};

/**
 * Publishes a message with the error data from an error response.
 *
 * @param {Object} data
 */
Api.publishErrorData = (data) => {
	pubChannel.publish(TOPICS.api.dataReceived.error, data);
};

export default Api;
export { ERRORS };
