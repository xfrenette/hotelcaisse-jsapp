import { Response } from 'node-fetch';
import { serialize } from 'serializr';
import Decimal from 'decimal.js';
import {
	decimal as decimalPropSchema,
	fieldValues as fieldValuesPropSchema,
	timestamp as timestampPropSchema,
} from 'vendor/serializr/propSchemas';
import Api, { ERRORS } from 'servers/Api';
import Business from 'business/Business';
import Register, { STATES } from 'business/Register';
import Order from 'business/Order';
import CashMovement from 'business/CashMovement';
import Credit from 'business/Credit';
import TransactionMode from 'business/TransactionMode';
import Transaction from 'business/Transaction';
import Product from 'business/Product';
import Item from 'business/Item';
import RoomSelection from 'business/RoomSelection';
import AppliedTax from 'business/AppliedTax';
import Room from 'business/Room';
import TestAuth from '../mock/TestAuth';
import TestLogger from '../mock/TestLogger';
import TestWriter from '../mock/TestWriter';

let api;
let auth;
let validResponse;
const originalFn = {
	validateResponse: Api.validateResponse,
	fetch: global.fetch,
};

beforeEach(() => {
	const url = 'https://api.example.com/1.0';
	auth = new TestAuth();
	api = new Api(url);
	validResponse = new Response('{"status":"ok"}');
});

afterEach(() => {
	Api.validateResponse = originalFn.validateResponse;
	global.fetch = originalFn.fetch;
});

describe('constructor()', () => {
	test('sets url', () => {
		const url = 'test-url';
		api = new Api(url);
		expect(api.url).toBe(url);
	});

	test('sets application', () => {
		const application = {};
		api = new Api('test', application);
		expect(api.application).toBe(application);
	});
});

describe('save', () => {
	test('works without writer', () => {
		// Should not throw or reject
		return api.save();
	});

	test('saves all data', () => {
		const writer = new TestWriter();
		writer.write = jest.fn(() => Promise.resolve());
		api.writer = writer;

		api.token = 'test-token';
		api.lastDataVersion = 'test-version';

		const expected = {
			token: api.token,
			lastDataVersion: api.lastDataVersion,
		};

		return api.save()
			.then(() => {
				expect(writer.write).toHaveBeenCalledWith(expected);
			});
	});
});

describe('update', () => {
	test('updates token', () => {
		const same = 'same-value';
		const newValue = 'new-value';
		api.token = 'old-value';
		api.lastDataVersion = same;
		api.update({
			token: newValue,
			other: 'ignore',
		});
		expect(api.token).toBe(newValue);
		expect(api.lastDataVersion).toBe(same);
	});

	test('updates lastDataVersion', () => {
		const same = 'same-value';
		const newValue = 'new-value';
		api.lastDataVersion = 'old-value';
		api.token = same;
		api.update({
			lastDataVersion: newValue,
			other: 'ignore',
		});
		expect(api.lastDataVersion).toBe(newValue);
		expect(api.token).toBe(same);
	});

	test('if token, sets auth.authenticated to true, else to false', () => {
		auth = new TestAuth();
		auth.authenticated = false;
		api.auth = auth;

		api.update({ token: 'fdfdsfd' });
		expect(auth.authenticated).toBe(true);

		api.update({ lastDataVersion: 'fdfdsfd' });
		expect(auth.authenticated).toBe(false);

		api.update({ token: 'fdfdsfd' });
		api.update({ token: null });
		expect(auth.authenticated).toBe(false);

		api.auth = null;
		api.update({ token: 'fdfdsfd' });
		// Should not throw
	});
});

describe('isAuthenticated', () => {
	test('returns false if no auth', () => {
		api.auth = null;
		expect(api.isAuthenticated()).toBeFalsy();
	});

	test('returns false if auth not authenticated', () => {
		auth.authenticated = false;
		api.auth = auth;
		expect(api.isAuthenticated()).toBeFalsy();
	});

	test('returns true if auth is authenticated', () => {
		auth.authenticated = true;
		api.auth = auth;
		expect(api.isAuthenticated()).toBeTruthy();
	});
});

describe('buildRequestBody()', () => {
	test('contains data IFF', () => {
		const data = {
			aa: 'bb',
			cc: true,
			dd: { ee: ['ff'] },
		};
		let res = api.buildRequestBody(data);
		expect(res.data).toEqual(data);

		res = api.buildRequestBody(null);
		expect(res.data).toBeUndefined();

		res = api.buildRequestBody();
		expect(res.data).toBeUndefined();
	});

	test('contains dataVersion number IFF set', () => {
		api.lastDataVersion = 'test-version-number';
		let res = api.buildRequestBody({});
		expect(res.dataVersion).toEqual(api.lastDataVersion);

		api.lastDataVersion = null;
		res = api.buildRequestBody({});
		expect(res.dataVersion).toBeUndefined();
	});

	test('contains dataVersion number IFF set', () => {
		api.lastDataVersion = 'test-version-number';
		let res = api.buildRequestBody({});
		expect(res.dataVersion).toEqual(api.lastDataVersion);

		api.lastDataVersion = null;
		res = api.buildRequestBody({});
		expect(res.dataVersion).toBeUndefined();
	});

	test('contains token number IFF (set and authenticated=true)', () => {
		api.token = 'test';
		let res = api.buildRequestBody({}, false);
		expect(res.token).toBeUndefined();

		api.token = null;
		res = api.buildRequestBody({});
		expect(res.token).toBeUndefined();

		api.token = 'test-token';
		res = api.buildRequestBody({});
		expect(res.token).toBe(api.token);
	});
});

describe('requestApi', () => {
	beforeEach(() => {
		global.fetch = jest.fn(() => Promise.resolve(validResponse));
	});

	test('calls fetch with POST and correct headers', () => {
		const expected = {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		};
		return api.requestApi()
			.then(() => {
				expect(global.fetch).toHaveBeenCalledWith(
					expect.anything(),
					expect.objectContaining(expected)
				);
			});
	});

	test('fetch body is undefined if body is null', () => {
		global.fetch = (url, init) => {
			expect(init.body).toBeUndefined();
			return Promise.resolve(validResponse);
		};
		return api.requestApi();
	});

	test('fetch body is JSONified body', () => {
		const body = {
			a: 'b',
			c: true,
		};
		const expected = {
			body: JSON.stringify(body),
		};
		return api.requestApi('/', body)
			.then(() => {
				expect(fetch).toHaveBeenCalledWith(expect.anything(), expect.objectContaining(expected));
			});
	});

	test('calls fetch with correct URL', () => {
		const path = '/test-path';
		const expected = api.url + path;
		api.requestApi(path);
		expect(fetch).toHaveBeenCalledWith(expected, expect.anything());
	});

	test('rejects error if fetch fails', () => {
		const message = 'test error message';
		global.fetch = () => Promise.reject(new TypeError(message));
		return api.requestApi()
			.then(
				() => {
					throw new Error('Should have rejected');
				},
				(e) => {
					expect(e.code).toBe(ERRORS.NETWORK_ERROR);
					expect(e.message).toBe(message);
				}
			);
	});

	test('rejects if response is not json', () => {
		global.fetch = () => Promise.resolve(new Response('invalid json'));
		return api.requestApi()
			.then(
				() => {
					throw new Error('Should have rejected');
				},
				(e) => {
					expect(e.code).toBe(ERRORS.INVALID_RESPONSE);
				}
			);
	});

	test('resolves with response object', () => {
		const expected = {
			a: 'b',
			c: true,
			d: 12.45678,
		};
		global.fetch = () => Promise.resolve(new Response(JSON.stringify(expected)));
		return api.requestApi()
			.then((data) => {
				expect(data).toEqual(expected);
			});
	});
});

describe('validateResponse()', () => {
	// eslint-disable-next-line arrow-body-style
	test('rejects if no status and error', () => {
		return Api.validateResponse({ data: 'tmp' })
			.then(
				() => {
					throw new Error('Should have rejected');
				},
				(e) => {
					expect(e.code).toBe(ERRORS.INVALID_RESPONSE);
				}
			);
	});

	test('resolves with same data if all valid', () => {
		const data = {
			status: 'error', // resolves even if an error
			data: { test: true },
			error: {
				code: 'test',
			},
		};
		return Api.validateResponse(data)
			.then((ret) => {
				expect(ret).toEqual(data);
			});
	});
});

describe('processResponseMeta', () => {
	test('updates token IIF present', () => {
		const oldToken = 'old-token';
		const newToken = 'new-token';
		api.token = oldToken;
		api.processResponseMeta({});
		expect(api.token).toBe(oldToken);
		api.processResponseMeta({ token: null });
		expect(api.token).toBe(oldToken);
		api.processResponseMeta({ token: newToken });
		expect(api.token).toBe(newToken);
	});

	test('updates lastDataVersion IIF present', () => {
		const oldVersion = 'old-version';
		const newVersion = 'new-version';
		api.lastDataVersion = oldVersion;
		api.processResponseMeta({});
		expect(api.lastDataVersion).toBe(oldVersion);
		api.processResponseMeta({ dataVersion: null });
		expect(api.lastDataVersion).toBe(oldVersion);
		api.processResponseMeta({ dataVersion: newVersion });
		expect(api.lastDataVersion).toBe(newVersion);
	});
});

describe('processResponseBusiness', () => {
	let business;

	beforeEach(() => {
		business = {
			update: jest.fn(),
		};

		api.application = { business };
	});

	test('does nothing if not present', () => {
		api.processResponseBusiness({});
		expect(business.update).not.toHaveBeenCalled();
	});

	test('does nothing if invalid', () => {
		const data = {
			business: { rooms: 'invalid' },
		};
		api.lastBusiness = new Business();
		api.processResponseBusiness(data);
		expect(business.update).not.toHaveBeenCalled();
		expect(api.lastBusiness).toBeNull();
	});

	test('calls update if valid', () => {
		const data = {
			business: { rooms: [] },
		};
		api.lastBusiness = null;
		api.processResponseBusiness(data);
		expect(business.update).toHaveBeenCalledWith(expect.any(Business));
		expect(api.lastBusiness).toBeInstanceOf(Business);
	});

	test('works if no application', () => {
		const data = {
			business: { rooms: [] },
		};
		api.application = null;
		api.lastBusiness = null;
		api.processResponseBusiness(data);
		expect(api.lastBusiness).toBeInstanceOf(Business);
	});
});

describe('processResponseRegister', () => {
	let register;

	beforeEach(() => {
		register = {
			update: jest.fn(),
		};

		api.application = { register };
	});

	test('does nothing if not present', () => {
		api.processResponseRegister({});
		expect(register.update).not.toHaveBeenCalled();
	});

	test('does nothing if invalid', () => {
		const data = {
			deviceRegister: { cashMovements: 'invalid' },
		};
		api.lastRegister = new Register();
		api.processResponseRegister(data);
		expect(register.update).not.toHaveBeenCalled();
		expect(api.lastRegister).toBeNull();
	});

	test('calls update if valid', () => {
		const data = {
			deviceRegister: { cashMovements: [], uuid: 'test' },
		};
		api.lastRegister = null;
		api.processResponseRegister(data);
		expect(register.update).toHaveBeenCalledWith(expect.any(Register));
		expect(api.lastRegister).toBeInstanceOf(Register);
	});

	test('calls update if null', () => {
		const data = {
			deviceRegister: null,
		};
		api.lastRegister = null;
		api.processResponseRegister(data);
		expect(register.update).toHaveBeenCalledWith(expect.any(Register));
		expect(api.lastRegister).toBeInstanceOf(Register);
		expect(api.lastRegister.state).toBe(STATES.UNINITIALIZED);
	});

	test('works if no application', () => {
		const data = {
			deviceRegister: { cashMovements: [], uuid: 'test' },
		};
		api.application = null;
		api.lastRegister = null;
		api.processResponseRegister(data);
		expect(api.lastRegister).toBeInstanceOf(Register);
	});
});

describe('processResponseAuth', () => {
	test('does nothing if no auth', () => {
		api.auth = null;
		api.processResponseAuth({ token: 'new-token' });
		// should not throw
	});

	describe('already authenticated', () => {
		beforeEach(() => {
			api.auth = auth;
			auth.authenticated = true;
		});

		test('does nothing if no token', () => {
			api.processResponseAuth({});
			expect(auth.authenticated).toBeTruthy();
		});

		test('does nothing if new token', () => {
			api.processResponseAuth({ token: 'new-token' });
			expect(auth.authenticated).toBeTruthy();
		});

		test('sets to false if auth error', () => {
			const data = {
				error: {
					code: ERRORS.AUTH_FAILED,
				},
			};
			api.processResponseAuth(data);
			expect(auth.authenticated).toBeFalsy();
		});
	});

	describe('not authenticated', () => {
		beforeEach(() => {
			api.auth = auth;
			auth.authenticated = false;
		});

		test('does nothing if no token', () => {
			api.processResponseAuth({});
			expect(auth.authenticated).toBeFalsy();
		});

		test('authenticates if token', () => {
			api.processResponseAuth({ token: 'new-token' });
			expect(auth.authenticated).toBeTruthy();
		});

		test('does nothing if auth error', () => {
			const data = {
				error: {
					code: ERRORS.AUTH_FAILED,
				},
			};
			api.processResponseAuth(data);
			expect(auth.authenticated).toBeFalsy();
		});
	});
});

describe('query', () => {
	const successResponseData = {
		status: 'ok',
		data: {
			test: 'true',
			foo: 'bar',
		},
		token: '123456',
	};

	const errorResponseData = {
		status: 'error',
		error: {
			code: 'test:error',
			message: 'test error message',
		},
	};

	beforeEach(() => {
		api.auth = auth;
		auth.authenticated = true;
		api.requestApi = () => Promise.resolve(successResponseData);
	});

	describe('not authenticated', () => {
		test('rejects if authenticated=true and no auth', () => {
			api.auth = null;
			return api.query()
				.then(
					() => {
						throw new Error('Should not resolve');
					},
					(e) => {
						expect(e.code).toBe(ERRORS.NOT_AUTH);
					}
				);
		});

		test('rejects if authenticated=true and not authenticated', () => {
			api.auth = auth;
			auth.authenticated = false;
			return api.query()
				.then(
					() => {
						throw new Error('Should not resolve');
					},
					(e) => {
						expect(e.code).toBe(ERRORS.NOT_AUTH);
					}
				);
		});
	});

	test('calls requestApi with expected data', () => {
		const data = { test: true };
		const path = '/path';
		const expected = api.buildRequestBody(data, true);
		api.requestApi = jest.fn(() => Promise.resolve(successResponseData));
		api.query(path, data);
		expect(api.requestApi).toHaveBeenCalledWith(path, expected);
	});

	test('rejects if requestApi rejects', () => {
		const error = { test: true };
		api.requestApi = () => Promise.reject(error);
		return api.query()
			.then(
				() => {
					throw new Error('Should not resolve');
				},
				(e) => {
					expect(e).toEqual(error);
				}
			);
	});

	test('validateResponse receives requestApi data', () => {
		Api.validateResponse = jest.fn(() => Promise.resolve(successResponseData));
		return api.query()
			.then(() => {
				expect(Api.validateResponse).toHaveBeenCalledWith(successResponseData);
			});
	});

	test('rejects if validateResponse rejects', () => {
		const error = { test: true };
		Api.validateResponse = () => Promise.reject(error);
		return api.query()
			.then(
				() => {
					throw new Error('Should not resolve');
				},
				(e) => {
					expect(e).toEqual(error);
				}
			);
	});

	test('calls processResponseMeta', () => {
		api.processResponseMeta = jest.fn();
		return api.query()
			.then(() => {
				expect(api.processResponseMeta).toHaveBeenCalledWith(successResponseData);
			});
	});

	test('calls processResponseBusiness', () => {
		api.processResponseBusiness = jest.fn();
		return api.query()
			.then(() => {
				expect(api.processResponseBusiness).toHaveBeenCalledWith(successResponseData);
			});
	});

	test('calls processResponseRegister', () => {
		api.processResponseRegister = jest.fn();
		return api.query()
			.then(() => {
				expect(api.processResponseRegister).toHaveBeenCalledWith(successResponseData);
			});
	});

	test('calls processResponseAuth if authenticated = true', () => {
		api.processResponseAuth = jest.fn();
		return api.query('/', {}, true)
			.then(() => {
				expect(api.processResponseAuth).toHaveBeenCalledWith(successResponseData);
			});
	});

	test('calls save', () => {
		api.save = jest.fn();
		return api.query()
			.then(() => {
				expect(api.save).toHaveBeenCalled();
			});
	});

	test('if error response data returned, reject with error', () => {
		api.requestApi = () => Promise.resolve(errorResponseData);
		return api.query()
			.then(
				() => {
					throw new Error('Should have rejected');
				},
				(error) => {
					expect(error.code).toBe(errorResponseData.error.code);
					expect(error.message).toBe(errorResponseData.error.message);
				}
			);
	});

	// eslint-disable-next-line arrow-body-style
	test('resolve with response data', () => {
		return api.query()
			.then((data) => {
				expect(data).toEqual(successResponseData.data);
			});
	});

	test('resolve with null if response has no data', () => {
		api.requestApi = () => Promise.resolve({ status: 'ok' });
		return api.query()
			.then((data) => {
				expect(data).toBeNull();
			});
	});

	test('logs when successful', () => {
		const logger = new TestLogger();
		logger.log = jest.fn();
		api.setLogger(logger);
		api.requestApi = () => Promise.resolve(successResponseData);
		return api.query('/')
			.then(() => {
				expect(logger.log).toHaveBeenCalledWith('info', 'servers.api', expect.anything(), expect.anything());
			});
	});

	test('logs when in error', () => {
		const logger = new TestLogger();
		logger.log = jest.fn();
		api.setLogger(logger);
		api.requestApi = () => Promise.resolve(errorResponseData);
		return api.query('/')
			.catch(() => {
				expect(logger.log).toHaveBeenCalledWith('error', 'servers.api', expect.anything(), expect.anything());
			});
	});
});

describe('linkDevice', () => {
	test('calls query', () => {
		const passcode = 'test-passcode';
		api.query = jest.fn(() => Promise.resolve(null));
		return api.linkDevice(passcode)
			.then(() => {
				expect(api.query).toHaveBeenCalledWith('/device/link', { passcode }, false);
			});
	});

	test('returns query promise', () => {
		const promise = Promise.resolve(null);
		api.query = jest.fn(() => promise);
		const actual = api.linkDevice('test');
		expect(actual).toBe(promise);
	});
});

describe('nextOrders', () => {
	test('rejects if query rejects', () => {
		api.query = () => Promise.reject();
		return api.nextOrders()
			.then(
				() => {
					throw new Error('Should have rejected');
				},
				() => true
			);
	});

	test('calls query with expected parameters', () => {
		const order = new Order('uuid-test');
		const quantity = 5;
		api.query = jest.fn(() => Promise.resolve([]));
		return api.nextOrders(quantity, order)
			.then(() => {
				expect(api.query).toHaveBeenCalledWith('/orders', { quantity, from: order.uuid });
			});
	});

	test('calls query with expected parameters (no from)', () => {
		const quantity = 5;
		api.query = jest.fn(() => Promise.resolve([]));
		return api.nextOrders(quantity)
			.then(() => {
				expect(api.query).toHaveBeenCalledWith('/orders', { quantity });
			});
	});

	test('resolves with array of Orders', () => {
		const order1 = new Order('uuid-1');
		// Next line because Order.createdAt is serialized as a number of seconds
		order1.createdAt.setMilliseconds(0);
		const order2 = new Order('uuid-2');
		order2.createdAt.setMilliseconds(0);

		api.query = jest.fn(() => Promise.resolve([
			serialize(order1),
			serialize(order2),
		]));
		return api.nextOrders(2)
			.then((data) => {
				expect(data.length).toBe(2);
				expect(data[0]).toBeInstanceOf(Order);
				expect(data[1].uuid).toBe(order2.uuid);
				expect(data[1].createdAt.getTime()).toBe(order2.createdAt.getTime());
			});
	});

	test('resolves with empty array if empty response', () => {
		api.query = jest.fn(() => Promise.resolve(null));
		return api.nextOrders(2)
			.then((data) => {
				expect(data).toBeInstanceOf(Array);
				expect(data.length).toBe(0);
			});
	});

	test('rejects if cannot deserialize', () => {
		api.query = jest.fn(() => Promise.resolve(['invalid order']));
		return api.nextOrders(2)
			.then(
				() => {
					throw new Error('Should have rejected');
				},
				(error) => {
					expect(error.code).toBe(ERRORS.INVALID_RESPONSE);
				}
			);
	});
});

describe('registerOpened', () => {
	test('calls query', () => {
		const register = new Register();
		register.uuid = 'test-uuid';
		register.open('test-employee', new Decimal(12.34));
		const expected = {
			uuid: register.uuid,
			employee: register.employee,
			cashAmount: register.openingCash.toString(),
			openedAt: timestampPropSchema().serializer(register.openedAt),
		};
		api.query = jest.fn(() => Promise.resolve(null));

		return api.registerOpened(register)
			.then(() => {
				expect(api.query).toHaveBeenCalledWith('/register/open', expected);
			});
	});

	test('returns query promise', () => {
		const promise = Promise.resolve(null);
		api.query = jest.fn(() => promise);
		const actual = api.registerOpened(new Register());
		expect(actual).toBe(promise);
	});
});

describe('registerClosed', () => {
	test('calls query', () => {
		const register = new Register();
		register.uuid = 'test-uuid';
		register.open('test-employee', new Decimal(12.34));
		register.close(new Decimal(10.89), 'test-post-ref', new Decimal(98.36));
		const expected = {
			uuid: register.uuid,
			cashAmount: register.closingCash.toString(),
			closedAt: timestampPropSchema().serializer(register.closedAt),
			POSTRef: register.POSTRef,
			POSTAmount: register.POSTAmount.toString(),
		};
		api.query = jest.fn(() => Promise.resolve(null));

		return api.registerClosed(register)
			.then(() => {
				expect(api.query).toHaveBeenCalledWith('/register/close', expected);
			});
	});

	test('returns query promise', () => {
		const promise = Promise.resolve(null);
		api.query = jest.fn(() => promise);
		const actual = api.registerClosed(new Register());
		expect(actual).toBe(promise);
	});
});

describe('cashMovementAdded', () => {
	test('calls query', () => {
		const cashMovement = new CashMovement('test-cash-movement', new Decimal(12.34), 'test-note');
		const expected = {
			uuid: cashMovement.uuid,
			amount: decimalPropSchema().serializer(cashMovement.amount),
			note: cashMovement.note,
			createdAt: timestampPropSchema().serializer(cashMovement.createdAt),
		};
		api.query = jest.fn(() => Promise.resolve(null));

		return api.cashMovementAdded(cashMovement)
			.then(() => {
				expect(api.query).toHaveBeenCalledWith('/cashMovements/add', expected);
			});
	});

	test('returns query promise', () => {
		const promise = Promise.resolve(null);
		api.query = jest.fn(() => promise);
		const actual = api.cashMovementAdded(new CashMovement());
		expect(actual).toBe(promise);
	});
});

describe('cashMovementRemoved', () => {
	test('calls query', () => {
		const cashMovement = new CashMovement('test-cash-movement', new Decimal(12.34), 'test-note');
		const expected = {
			uuid: cashMovement.uuid,
		};
		api.query = jest.fn(() => Promise.resolve(null));

		return api.cashMovementRemoved(cashMovement)
			.then(() => {
				expect(api.query).toHaveBeenCalledWith('/cashMovements/delete', expected);
			});
	});

	test('returns query promise', () => {
		const promise = Promise.resolve(null);
		api.query = jest.fn(() => promise);
		const actual = api.cashMovementRemoved(new CashMovement());
		expect(actual).toBe(promise);
	});
});

function createOrder() {
	const transactionMode = new TransactionMode();
	transactionMode.id = 123;
	transactionMode.name = 'test tm';

	const room = new Room();
	room.id = 987;
	room.name = 'test room';

	const product = new Product();
	product.id = 456;
	product.name = 'test product';
	product.price = new Decimal(1.23);

	const subProduct = new Product();
	subProduct.id = 4561;
	subProduct.name = 'sub product';
	subProduct.price = new Decimal(17.43);
	subProduct.taxes.push(new AppliedTax(234, 'tax 1', new Decimal(8.11)));
	subProduct.taxes.push(new AppliedTax(235, 'tax 2', new Decimal(1.88)));

	product.addVariant(subProduct);

	const order = new Order('test-order-uuid');
	order.note = 'test order note';
	order.customer.setFieldValue({ id: 6321 }, 'test 1');
	order.customer.setFieldValue({ id: 6322 }, 'test 2');
	order.credits.push(new Credit('c1', new Decimal(12.34), 'note c 1'));
	order.credits.push(new Credit('c2', new Decimal(56.78), 'note c 2'));
	order.transactions.push(new Transaction('t1', new Decimal(96.32), transactionMode));
	order.transactions.push(new Transaction('t2', new Decimal(-32.54), transactionMode));

	for (let i = 0; i < 2; i += 1) {
		const item = new Item(`i${i}`);
		item.product = i === 0 ? product : subProduct;
		item.quantity = i === 0 ? 2 : -2;
		order.items.push(item);
	}

	for (let i = 0; i < 2; i += 1) {
		const roomSelection = new RoomSelection('rs1');
		roomSelection.room = room;
		roomSelection.startDate = new Date(2017, 2, 4);
		roomSelection.endDate = new Date(2017, 2, 7);
		roomSelection.setFieldValue({ id: 6323 }, 'test-2');
		order.roomSelections.push(roomSelection);
	}

	return order;
}

function buildOrderQueryData(order, type) {
	const data = {
		uuid: order.uuid,
	};

	if (order.note !== null) {
		data.note = order.note;
	}

	if (order.customer !== null) {
		data.customer = {
			fieldValues: fieldValuesPropSchema().serializer(order.customer.fieldValues),
		};
	}

	if (order.credits !== null) {
		data.credits = order.credits.map(credit => ({
			uuid: credit.uuid,
			note: credit.note,
			amount: decimalPropSchema().serializer(credit.amount),
			createdAt: timestampPropSchema().serializer(credit.createdAt),
		}));
	}

	if (order.transactions !== null) {
		data.transactions = order.transactions.map(transaction => ({
			uuid: transaction.uuid,
			amount: decimalPropSchema().serializer(transaction.amount),
			createdAt: timestampPropSchema().serializer(transaction.createdAt),
			transactionModeId: transaction.transactionMode ? transaction.transactionMode.id : null,
		}));
	}

	if (order.items !== null) {
		data.items = order.items.map(item => ({
			uuid: item.uuid,
			quantity: item.quantity,
			createdAt: timestampPropSchema().serializer(item.createdAt),
			product: item.product
				? {
					name: item.product.extendedName,
					price: decimalPropSchema().serializer(item.product.price),
					productId: item.product.id,
					taxes: item.product.taxes.map(tax => ({
						taxId: tax.taxId,
						amount: decimalPropSchema().serializer(tax.amount),
					})),
				}
				: null,
		}));
	}

	if (order.roomSelections !== null) {
		data.roomSelections = order.roomSelections.map(roomSelection => ({
			uuid: roomSelection.uuid,
			startDate: timestampPropSchema().serializer(roomSelection.startDate),
			endDate: timestampPropSchema().serializer(roomSelection.endDate),
			roomId: roomSelection.room ? roomSelection.room.id : null,
			fieldValues: fieldValuesPropSchema().serializer(roomSelection.fieldValues),
		}));
	}

	if (type === 'new') {
		data.createdAt = timestampPropSchema().serializer(order.createdAt);
	}

	return data;
}

describe('orderCreated', () => {
	test('calls query', () => {
		const order = createOrder();
		const expected = buildOrderQueryData(order, 'new');
		api.query = (path, data) => {
			expect(path).toBe('/orders/new');
			expect(data).toEqual(expected);
			return Promise.resolve(null);
		};
		return api.orderCreated(order);
	});

	test('returns query promise', () => {
		const promise = Promise.resolve(null);
		api.query = jest.fn(() => promise);
		const actual = api.orderCreated(new Order());
		expect(actual).toBe(promise);
	});
});

describe('orderChanged', () => {
	test('calls query when changes', () => {
		const order = createOrder();
		order.recordChanges();
		order.note = `${order.note}-new`;
		order.customer.setFieldValue({ id: 88745, value: 'new-value' });
		order.items.push(new Item('test-item'));
		order.credits.push(new Credit('test-credit'));
		order.transactions.push(new Transaction('test-transaction'));
		order.roomSelections.push(new RoomSelection('test-room-selection'));
		const diff = order.getChanges();
		const expected = buildOrderQueryData(diff, 'changes');
		expected.uuid = order.uuid;

		api.query = (path, data) => {
			expect(path).toBe('/orders/edit');
			expect(data).toEqual(expected);
			return Promise.resolve(null);
		};
		return api.orderChanged(order, diff);
	});

	test('calls query with only modified elements', () => {
		const order = createOrder();
		order.recordChanges();
		order.note = `${order.note}-new`;
		const diff = order.getChanges();
		const expected = {
			uuid: order.uuid,
			note: order.note,
		};

		api.query = (path, data) => {
			expect(path).toBe('/orders/edit');
			expect(data).toEqual(expected);
			return Promise.resolve(null);
		};
		return api.orderChanged(order, diff);
	});

	test('does not call query if no changes', () => {
		const order = createOrder();
		order.recordChanges();
		const diff = order.getChanges();

		api.query = jest.fn(() => Promise.resolve('should not be used'));
		return api.orderChanged(order, diff)
			.then((data) => {
				expect(api.query).not.toHaveBeenCalled();
				expect(data).toBeNull();
			});
	});
});

describe('getBusiness', () => {
	beforeEach(() => {
		api.isAuthenticated = () => true;
	});

	test('rejects if query rejects', () => {
		api.query = () => Promise.reject();
		return api.getBusiness()
			.then(
				() => { throw new Error('Should have rejected'); },
				() => true
			);
	});

	test('calls query with expected parameters', () => {
		api.lastBusiness = new Business();
		api.query = jest.fn(() => Promise.resolve({}));
		return api.getBusiness()
			.then(() => {
				expect(api.query).toHaveBeenCalledWith('/deviceData');
			});
	});

	test('resolves with Business', () => {
		const business = new Business();
		business.transactionModes.push(new TransactionMode(123, 'test'));

		api.requestApi = jest.fn(
			() => Promise.resolve({ status: 'ok', business: serialize(business) })
		);
		return api.getBusiness()
			.then((data) => {
				expect(data).toBeInstanceOf(Business);
				expect(data.transactionModes[0].id).toBe(business.transactionModes[0].id);
			});
	});

	test('rejects if response doesn\'t have business', () => {
		api.requestApi = jest.fn(() => Promise.resolve({ status: 'ok', data: {} }));
		return api.getBusiness()
			.then(
				() => { throw new Error('Should have rejected'); },
				(error) => {
					expect(error.code).toBe(ERRORS.INVALID_RESPONSE);
				}
			);
	});

	test('rejects if cannot deserialize', () => {
		api.requestApi = jest.fn(
			() => Promise.resolve({ status: 'ok', business: 'invalid business' })
		);
		return api.getBusiness()
			.then(
				() => { throw new Error('Should have rejected'); },
				(error) => {
					expect(error.code).toBe(ERRORS.INVALID_RESPONSE);
				}
			);
	});
});

describe('getRegister', () => {
	beforeEach(() => {
		api.isAuthenticated = () => true;
	});

	test('rejects if query rejects', () => {
		api.query = () => Promise.reject();
		return api.getRegister()
			.then(
				() => { throw new Error('Should have rejected'); },
				() => true
			);
	});

	test('calls query with expected parameters', () => {
		api.lastRegister = new Register();
		api.query = jest.fn(() => Promise.resolve({}));
		return api.getRegister()
			.then(() => {
				expect(api.query).toHaveBeenCalledWith('/deviceData');
			});
	});

	test('resolves with Register', () => {
		const register = new Register();
		register.uuid = 'test-register';

		api.requestApi = jest.fn(
			() => Promise.resolve({ status: 'ok', deviceRegister: serialize(register) })
		);
		return api.getRegister()
			.then((data) => {
				expect(data).toBeInstanceOf(Register);
				expect(data.uuid).toBe(register.uuid);
			});
	});

	test('rejects if response doesn\'t have register', () => {
		api.requestApi = jest.fn(() => Promise.resolve({ status: 'ok', data: {} }));
		return api.getRegister()
			.then(
				() => { throw new Error('Should have rejected'); },
				(error) => {
					expect(error.code).toBe(ERRORS.INVALID_RESPONSE);
				}
			);
	});

	test('rejects if cannot deserialize', () => {
		api.requestApi = jest.fn(
			() => Promise.resolve({ status: 'ok', deviceRegister: 'invalid register' })
		);
		return api.getRegister()
			.then(
				() => { throw new Error('Should have rejected'); },
				(error) => {
					expect(error.code).toBe(ERRORS.INVALID_RESPONSE);
				}
			);
	});
});
