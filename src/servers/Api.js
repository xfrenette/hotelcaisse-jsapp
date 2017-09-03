import { deserialize, serialize } from 'serializr';
import pick from 'lodash.pick';
import { ERRORS as AUTH_ERRORS } from '../auth/Auth';
import Server from './Server';
import Business from '../business/Business';
import Register from '../business/Register';
import Order from '../business/Order';

/**
 * Error codes that can be returned.
 *
 * @type {Object}
 */
const ERRORS = {
	SERVER_ERROR: 'server:error',
	NETWORK_ERROR: 'network:error',
	INVALID_RESPONSE: 'response:invalid',
	AUTH_FAILED: AUTH_ERRORS.AUTHENTICATION_FAILED,
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
	 * Last Business instance that was in a response's `business` attribute. If a response
	 * contains an invalid Business instance (present, but invalid), this property will be set
	 * to null.
	 *
	 * @type {Business}
	 */
	lastBusiness = null;
	/**
	 * Last Register instance that was in a response's `deviceRegister` attribute. If a response
	 * contains an invalid Register instance (present, but invalid), this property will be set to
	 * null.
	 *
	 * @type {Register}
	 */
	lastRegister = null;
	/**
	 * Namespaced logger to use.
	 *
	 * @type {Logger}
	 */
	logger = null;
	/**
	 * Writer where this instance can save some data (ex: token, list of waiting queries, ...).
	 *
	 * @type {Writer}
	 */
	writer = null;

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
	 * Sets the logger instance
	 *
	 * @param {Logger} logger
	 */
	setLogger(logger) {
		this.logger = logger.getNamespace('servers.api');
	}

	/**
	 * Logs an 'info' message, only if we have a logger.
	 *
	 * @param {string} type
	 * @param {string} message
	 * @param {*} data
	 */
	log(type, message, data) {
		if (this.logger) {
			this.logger[type].call(this.logger, message, data);
		}
	}

	/**
	 * Saves in the writer the internal state. Returns the writer's write Promise
	 * - token
	 * - lastDataVersion
	 *
	 * @return {Promise}
	 */
	save() {
		if (!this.writer) {
			return Promise.resolve();
		}

		return this.writer.write({
			token: this.token,
			lastDataVersion: this.lastDataVersion,
		});
	}

	/**
	 * Updates the internal state from the object.
	 * - token
	 * - lastDataVersion
	 *
	 * @param {object} values
	 */
	update(values) {
		const attributes = ['token', 'lastDataVersion'];

		attributes.forEach((attr) => {
			if (values[attr]) {
				this[attr] = values[attr];
			}
		});

		// If we have an auth class, we set its `authenticated` attribute
		if (this.auth) {
			this.auth.authenticated = !!values.token;
		}
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
		this.log('info', `Starting query to ${path}...`);
		if (authenticated && !this.isAuthenticated()) {
			this.log('warn', 'Not authenticated');
			return Promise.reject(createError(
				ERRORS.NOT_AUTH,
				'This request can be made only if authenticated.'
			));
		}

		const body = this.buildRequestBody(data, authenticated);

		const res = this.requestApi(path, body)
			.then(Api.validateResponse)
			.then((responseData) => {
				this.processResponseMeta(responseData);
				this.processResponseBusiness(responseData);
				this.processResponseRegister(responseData);
				this.processResponseAuth(responseData);
				this.save();

				if (responseData.status !== 'ok') {
					return Promise.reject(Api.buildErrorObjectForResponse(responseData));
				}

				return responseData.data || null;
			});

		res.then(
			(resData) => { this.log('info', `${path} (success)`, resData); },
			(resError) => { this.log('error', `${path} (error)`, resError); }
		);

		return res;
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
	 * If the data has a `business` attribute, tries to deserialize it. If successful, updates the
	 * application's business instance and saves it in the `lastBusiness` attribute. Note that if
	 * the deserialization fails, this method fails silently since it is not as important as the
	 * data of the response.  The `lastBusiness` attribute will be set to null.
	 *
	 * @param {object} data
	 */
	processResponseBusiness(data) {
		if (!data.business) {
			return;
		}

		try {
			this.log('info', 'Received new Business', data.business);
			const business = deserialize(Business, data.business);
			this.lastBusiness = business;

			if (this.application) {
				this.application.business.update(business);
			}
		} catch (e) {
			this.lastBusiness = null;
		}
	}

	/**
	 * If the data has a `deviceRegister` attribute, tries to deserialize it. (Note that if `null`,
	 * it means the device doesn't have a current register, so we will use a new, uninitialized
	 * Register.) If successful, updates the application's register instance and saves the Register
	 * in `lastRegister`. Note that if the deserialization fails, this method fails silently since
	 * it is not as important as the data of the response. The `lastRegister` attribute will be set
	 * to null (which means an error).
	 *
	 * @param {object} data
	 */
	processResponseRegister(data) {
		if (!data.deviceRegister && data.deviceRegister !== null) {
			return;
		}

		try {
			this.log('info', 'Received new Register', data.deviceRegister);
			const register = data.deviceRegister === null
				? new Register()
				: deserialize(Register, data.deviceRegister);
			this.lastRegister = register;

			if (this.application) {
				this.application.register.update(register);
			}
		} catch (e) {
			this.lastRegister = null;
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
				this.auth.invalidate();
			}
		} else if (data.token) {
			this.auth.authenticated = true;
		}
	}

	/**
	 * Calls the /device/link API method with the `passcode` and returns a Promise with the result.
	 *
	 * @param {string} passcode
	 * @return {Promise}
	 */
	linkDevice(passcode) {
		return this.query('/device/link', { passcode }, false);
	}

	/**
	 * We query /deviceData. This method is special since it doesn't return the Business in its
	 * `data` attribute, but `business`. This Business will automatically be deserialized in
	 * `lastBusiness`. So we do the request, and once finished, return the value in `lastBusiness`.
	 * Note that if it is null, it means it could not be deserialized (so we return an error).
	 *
	 * @see Server
	 * @return {Promise.<Business>}
	 */
	getBusiness() {
		return this.query('/deviceData')
			.then(() => {
				if (this.lastBusiness === null) {
					return Promise.reject(createError(
						ERRORS.INVALID_RESPONSE,
						'Could not deserialize Business'
					));
				}

				return this.lastBusiness;
			});
	}

	/**
	 * We query /deviceData. This method is special since it doesn't return the Register in its
	 * `data` attribute, but `register`. This Register will automatically be deserialized in
	 * `lastRegister`. So we do the request, and once finished, return the value in `lastRegister`.
	 * Note that if it is null, it means it could not be deserialized (so we return an error).
	 *
	 * @see Server
	 * @return {Promise.<Register>}
	 */
	getRegister() {
		return this.query('/deviceData')
			.then(() => {
				if (this.lastRegister === null) {
					return Promise.reject(createError(
						ERRORS.INVALID_RESPONSE,
						'Could not deserialize Register'
					));
				}

				return this.lastRegister;
			});
	}

	/**
	 * @see Server
	 * @param {number} quantity
	 * @param {Order} from
	 * @return {Promise.<Array<Order>>}
	 */
	nextOrders(quantity, from = null) {
		const data = { quantity };

		if (from) {
			data.from = from.uuid;
		}

		return this.query('/orders', data)
			.then((responseData) => {
				if (!responseData || !responseData.map) {
					return [];
				}

				try {
					return responseData.map(serializedOrder => deserialize(Order, serializedOrder));
				} catch (error) {
					return Promise.reject(createError(
						ERRORS.INVALID_RESPONSE,
						`Could not deserialize Order: ${error.message}`
					));
				}
			});
	}

	/**
	 * @see Server
	 * @param {Register} register
	 * @return {Promise}
	 */
	registerOpened(register) {
		const serialized = serialize(register);
		const data = pick(serialized, ['uuid', 'employee', 'openedAt']);
		data.cashAmount = serialized.openingCash;
		return this.query('/register/open', data);
	}

	/**
	 * @see Server
	 * @param {Register} register
	 * @return {Promise}
	 */
	registerClosed(register) {
		const serialized = serialize(register);
		const data = pick(serialized, ['uuid', 'POSTRef', 'POSTAmount', 'closedAt']);
		data.cashAmount = serialized.closingCash;
		return this.query('/register/close', data);
	}

	/**
	 * @see Server
	 * @param {cashMovement} cashMovement
	 * @return {Promise}
	 */
	cashMovementAdded(cashMovement) {
		const serialized = serialize(cashMovement);
		const data = pick(serialized, ['uuid', 'amount', 'note', 'createdAt']);
		return this.query('/cashMovements/add', data);
	}

	/**
	 * @see Server
	 * @param {cashMovement} cashMovement
	 * @return {Promise}
	 */
	cashMovementRemoved(cashMovement) {
		return this.query('/cashMovements/delete', { uuid: cashMovement.uuid });
	}

	/**
	 * @see Server
	 * @param {Order} order
	 * @return {Promise}
	 */
	orderCreated(order) {
		const data = this.buildOrderApiData(order);

		return this.query('/orders/new', data);
	}

	/**
	 * @see Server
	 * @param {Order} order
	 * @param {OrderChanges} changes
	 * @return {Promise}
	 */
	orderChanged(order, changes) {
		// If `changes` has no changes, we resolve immediately
		if (!changes.hasChanges()) {
			return Promise.resolve(null);
		}

		const serializedChanges = this.buildOrderApiData(changes);
		// we keep only the changed fields
		const data = pick(serializedChanges, changes.changedFields);
		data.uuid = order.uuid;

		return this.query('/orders/edit', data);
	}

	/**
	 * From the Order or OrderChanges `orderLike` object, returns a serialized object that
	 * respects the api.
	 *
	 * @param {Order|OrderChanges} orderLike
	 * @return {object}
	 */
	buildOrderApiData(orderLike) {
		const data = serialize(orderLike);

		/**
		 * Adjust some keys to respect the api
		 */

		// items.*.product
		if (orderLike.items) {
			orderLike.items.forEach((item, index) => {
				const productData = data.items[index].product;

				data.items[index].product = productData
					? {
						...pick(productData, ['price', 'productId', 'taxes']),
						name: item.product.extendedName,
						productId: item.product.id,
						taxes: productData.taxes.map(tax => pick(tax, ['taxId', 'amount'])),
					}
					: null;
			});
		}

		// transactions
		if (orderLike.transactions) {
			orderLike.transactions.forEach((transaction, index) => {
				const transactionData = data.transactions[index];
				data.transactions[index] = {
					...pick(transactionData, ['uuid', 'amount', 'createdAt']),
					transactionModeId: transaction.transactionMode ? transaction.transactionMode.id : null,
				};
			});
		}

		// roomSelections.*.room -> roomId
		if (orderLike.roomSelections) {
			orderLike.roomSelections.forEach((roomSelection, index) => {
				data.roomSelections[index].roomId = roomSelection.room ? roomSelection.room.id : null;
				// eslint-disable-next-line
				delete data.roomSelections[index]['room'];
			});
		}

		return data;
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
