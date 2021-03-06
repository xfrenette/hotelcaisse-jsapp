import { deserialize, serialize } from 'serializr';
import EventEmitter from 'events';
import pick from 'lodash.pick';
import { ERRORS as AUTH_ERRORS } from '../auth/Auth';
import { mixin as serverMixin } from './Server';
import Business from '../business/Business';
import Device from '../business/Device';
import Order from '../business/Order';

/**
 * Error codes that can be returned.
 *
 * @type {Object}
 */
const ERRORS = {
	SERVER_ERROR: 'server:error',
	REQUEST_ERROR: 'request:error',
	NETWORK_ERROR: 'network:error',
	INVALID_RESPONSE: 'response:invalid',
	AUTH_FAILED: AUTH_ERRORS.AUTHENTICATION_FAILED,
	NOT_AUTH: 'request:notAuthenticated',
};

/**
 * When a queued query fails, it will be tried again after a delay. At each fail, it will be
 * tried again after a longer delay. This is the maximum delay that can be waited.
 *
 * @type {number}
 */
const RETRY_DELAY_MAX = 15 * 60 * 1000; // 15 minutes
/**
 * The first (minimum) delay
 *
 * @type {number}
 */
const RETRY_DELAY_MIN = 15 * 1000; // 15 seconds

function createError(code, message) {
	return {
		code,
		message,
	};
}

/**
 * Returns a Promise that resolves after `time` (milliseconds). Uses `setTimeoutFn` as the
 * timeout function.
 *
 * @param {number} time
 * @param {function} setTimeoutFn
 * @return {Promise}
 */
function delay(time, setTimeoutFn) {
	return new Promise((resolve) => {
		setTimeoutFn(resolve, time);
	});
}

/**
 * Takes the error object returned by `query()` and returns a boolean indicating if the request
 * should be tried again (because we expect it might work eventually). Errors generated because
 * of the client will not be retried (ex: authentication error, invalid request, ...)
 *
 * @param {object} err
 * @return {boolean}
 */
function shouldQueryBeRetried(err) {
	const doNotRetryFor = [ERRORS.REQUEST_ERROR, ERRORS.AUTH_FAILED];
	return doNotRetryFor.indexOf(err.code) === -1;
}

class Api extends serverMixin(EventEmitter) { // Extends Server and EventEmitter
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
	 * Last Business instance that was in a response's `business` attribute. If a response
	 * contains an invalid Business instance (present, but invalid), this property will be set
	 * to null.
	 *
	 * @type {Business}
	 */
	lastBusiness = null;
	/**
	 * Last Device instance that was in a response's `device` attribute. If a response
	 * contains an invalid Device instance (present, but invalid), this property will be set to
	 * null.
	 *
	 * @type {Device}
	 */
	lastDevice = null;
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
	 * Internal list of queries to execute. Each item is an object with the following entries:
	 * `params` {array} List of parameters to pass to `query()`
	 * `resolve` {function} Optional. Callback to call when `query()` resolves
	 * `reject` {function} Optional. Callback to call when `query()` rejects
	 *
	 * @type {array}
	 */
	queriesQueue = [];
	/**
	 * True when the queue is running, false when it ends
	 * @type {boolean}
	 */
	queueRunning = false;
	/**
	 * True when a request is running, false when it ends.
	 * @type {boolean}
	 */
	requestRunning = false;
	/**
	 * Last delay returned by getNextRetryDelay(). If null, the next call will return
	 * RETRY_DELAY_MIN.
	 *
	 * @type {number}
	 */
	lastRetryDelay = null;
	/**
	 * setTimeout method to use (a special one is used in the react native app).
	 * @type {function}
	 */
	setTimeout = setTimeout;

	/**
	 * @param {string} url API url
	 */
	constructor(url) {
		super();
		this.url = url;
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

		const savedQueries = this.queriesQueue.map(({ params }) => ({ params }));

		return this.writer.write({
			token: this.token,
			lastDataVersion: this.lastDataVersion,
			queriesQueue: savedQueries,
		});
	}

	/**
	 * Updates the internal state from the object.
	 * - token
	 * - lastDataVersion
	 * - queriesQueue
	 *
	 * @param {object} values
	 */
	update(values) {
		const attributes = ['token', 'lastDataVersion', 'queriesQueue'];

		attributes.forEach((attr) => {
			if (values[attr]) {
				this[attr] = values[attr];
			}
		});

		// If we have an auth class, we set its `authenticated` attribute
		if (this.auth) {
			this.auth.authenticated = !!values.token;
		}

		// We run the queue
		this.runQueue();
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
	 * Adds to the queue a new call to query with the same attributes. The queue is a FIFO
	 * queue. When a query ends the following one is executed. If a query rejects and it should
	 * be retried (see shouldRetryQuery), it is added again to the end of the queue. Returns a
	 * promise that resolves with the promise returned by query. If the query fails and it
	 * should not be retried, rejects with the error object.
	 *
	 * A method that calls `queueQuery()` instead of `query()` should not see any difference.
	 *
	 * @return {Promise}
	 */
	queueQuery(...params) {
		return new Promise((resolve, reject) => {
			this.queriesQueue.push({ params, resolve, reject });
			this.save();
			this.runQueue();
		});
	}

	/**
	 * Executes the next query in the `queriesQueue` array. (Note that if it is already runnind, or
	 * if there is no other query, stops there.) Will run a `query()` call with the `params`. If it
	 * resolves and the next query has a `resolve` callback, will execute it. If it fails, checks if
	 * the query should be retried (see `shouldQueryBeRetried()`). If so, puts the query back to the
	 * beginning of the `queriesQueue` (so it will be the next one tried). Else, if the query has a
	 * `reject` callback, it is called with the error object. In all cases, re-runs this function
	 * after
	 */
	runQueue() {
		if (this.queueRunning || !this.queriesQueue.length) {
			return;
		}

		this.log('info', 'Running queries queue');

		const nextQuery = this.queriesQueue.shift();
		this.queueRunning = true;
		this.query(...nextQuery.params).then(
			(data) => {
				if (nextQuery.resolve) {
					nextQuery.resolve(data);
				}
				this.resetRetryDelay();
			},
			(err) => {
				if (shouldQueryBeRetried(err)) {
					const retryDelay = this.getNextRetryDelay();
					this.queriesQueue.unshift(nextQuery);
					this.log('info', `Will retry query in ${retryDelay / 1000} seconds`);
					return delay(retryDelay, this.setTimeout);
				} else if (nextQuery.reject) {
					nextQuery.reject(err);
				}
				this.resetRetryDelay();
				return null;
			}
		).then(() => {
			// Will always execute
			this.queueRunning = false;
			this.runQueue();
		});
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
				this.processResponseDevice(responseData);
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
		this.requestRunning = true;

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

		const requestResult = fetch(url, init);

		requestResult.then(
			() => { this.requestRunning = false; },
			() => { this.requestRunning = false; }
		);

		return requestResult.then(resolved, rejected);
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
	 * If the data has a `business` attribute, tries to deserialize it. If successful, triggers a
	 * 'businessUpdate' event with the raw data and saves the Business instance in the
	 * `lastBusiness` attribute. Note that if the deserialization fails, this method fails silently
	 * since it is not as important as the data of the response.  The `lastBusiness` attribute will
	 * be set to null.
	 *
	 * @param {object} data
	 */
	processResponseBusiness(data) {
		if (!data.business) {
			return;
		}

		try {
			this.log('info', 'Received new Business', data.business);
			// We try to deserialize, even if it is the serialized data that is sent in the event
			const business = deserialize(Business, data.business);
			this.lastBusiness = business;
			this.emit('businessUpdate', data.business);
		} catch (e) {
			// Deserialization failed
			this.lastBusiness = null;
		}
	}

	/**
	 * If the data has a `device` attribute, tries to deserialize it. If successful, triggers the
	 * 'deviceUpdate' event (with the data, not the deserialized Device) and saves the Device
	 * instance in `lastDevice`. Note that if the deserialization fails, this method fails silently
	 * since it is not as important as the data of the response. The `lastDevice` attribute will be
	 * set to null (which means an error).
	 *
	 * @param {object} data
	 */
	processResponseDevice(data) {
		if (!data.device) {
			return;
		}

		try {
			this.log('info', 'Received new Device', data.device);
			// Try to deserialize
			const device = deserialize(Device, data.device);
			this.lastDevice = device;
			this.emit('deviceUpdate', data.device);
		} catch (e) {
			this.lastDevice = null;
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
	 * We query /deviceData. This method is special since it doesn't return the Device in its
	 * `data` attribute, but `device`. This Device will automatically be deserialized in
	 * `lastDevice`. So we do the request, and once finished, return the value in `lastDevice`.
	 * Note that if it is null, it means it could not be deserialized (so we return an error).
	 *
	 * @see Server
	 * @return {Promise.<Device>}
	 */
	getDevice() {
		return this.query('/deviceData')
			.then(() => {
				if (this.lastDevice === null) {
					return Promise.reject(createError(
						ERRORS.INVALID_RESPONSE,
						'Could not deserialize Device'
					));
				}

				return this.lastDevice;
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
	 * This query is queued
	 * @see Server
	 * @param {Register} register
	 * @return {Promise}
	 */
	registerOpened(register) {
		const serialized = serialize(register);
		const data = pick(serialized, ['uuid', 'number', 'employee', 'openedAt']);
		data.cashAmount = serialized.openingCash;
		return this.queueQuery('/register/open', data);
	}

	/**
	 * This query is queued
	 * @see Server
	 * @param {Register} register
	 * @return {Promise}
	 */
	registerClosed(register) {
		const serialized = serialize(register);
		const data = pick(serialized, ['uuid', 'POSTRef', 'POSTAmount', 'closedAt']);
		data.cashAmount = serialized.closingCash;
		return this.queueQuery('/register/close', data);
	}

	/**
	 * Queued query
	 * @see Server
	 * @param {cashMovement} cashMovement
	 * @return {Promise}
	 */
	cashMovementAdded(cashMovement) {
		const serialized = serialize(cashMovement);
		const data = pick(serialized, ['uuid', 'amount', 'note', 'createdAt']);
		return this.queueQuery('/cashMovements/add', data);
	}

	/**
	 * Queued query
	 * @see Server
	 * @param {cashMovement} cashMovement
	 * @return {Promise}
	 */
	cashMovementRemoved(cashMovement) {
		return this.queueQuery('/cashMovements/delete', { uuid: cashMovement.uuid });
	}

	/**
	 * Queued query
	 * @see Server
	 * @param {Order} order
	 * @return {Promise}
	 */
	orderCreated(order) {
		const data = this.buildOrderApiData(order);

		return this.queueQuery('/orders/new', data);
	}

	/**
	 * Queued query
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

		return this.queueQuery('/orders/edit', data);
	}

	/**
	 * Sends a simple 'ping' request to the server. Because it is used to only make a request to
	 * the server, it is useless if a query is already running or if the queue is not empty.
	 */
	ping() {
		if (this.queueRunning || this.requestRunning || this.queriesQueue.length) {
			return Promise.resolve();
		}

		if (this.auth && !this.auth.authenticated) {
			return Promise.resolve();
		}

		return this.query('/ping');
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

	/**
	 * Returns the next delay before trying again a failed queued query. The result will be between
	 * RETRY_DELAY_MIN and RETRY_DELAY_MAX. It is doubled at each call. Call `resetRetryDelay()`
	 * to reset to RETRY_DELAY_MIN.
	 *
	 * @return {number}
	 */
	getNextRetryDelay() {
		let nextDelay;

		if (this.lastRetryDelay === null) {
			nextDelay = RETRY_DELAY_MIN;
		} else {
			nextDelay = Math.min(this.lastRetryDelay * 2, RETRY_DELAY_MAX);
		}

		this.lastRetryDelay = nextDelay;
		return nextDelay;
	}

	/**
	 * Resets the next retry delay.
	 */
	resetRetryDelay() {
		this.lastRetryDelay = null;
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
export { ERRORS, RETRY_DELAY_MAX, RETRY_DELAY_MIN };
