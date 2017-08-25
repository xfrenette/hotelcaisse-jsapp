import { Response } from 'node-fetch';
import Api, { ERRORS } from 'servers/Api';
import Business from 'business/Business';
import TestAuth from '../mock/TestAuth';
import Register from '../../src/business/Register';

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
				() => { throw new Error('Should have rejected'); },
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
				() => { throw new Error('Should have rejected'); },
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
		api.processResponseBusiness(data);
		expect(business.update).not.toHaveBeenCalled();
	});

	test('calls update if valid', () => {
		const data = {
			business: { rooms: [] },
		};
		api.processResponseBusiness(data);
		expect(business.update).toHaveBeenCalledWith(expect.any(Business));
	});

	test('works if no application', () => {
		const data = {
			business: { rooms: [] },
		};
		api.application = null;
		api.processResponseBusiness(data);
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
			register: { cashMovements: 'invalid' },
		};
		api.processResponseRegister(data);
		expect(register.update).not.toHaveBeenCalled();
	});

	test('calls update if valid', () => {
		const data = {
			register: { cashMovements: [], uuid: 'test' },
		};
		api.processResponseRegister(data);
		expect(register.update).toHaveBeenCalledWith(expect.any(Register));
	});

	test('works if no application', () => {
		const data = {
			register: { cashMovements: [], uuid: 'test' },
		};
		api.application = null;
		api.processResponseRegister(data);
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
					() => { throw new Error('Should not resolve'); },
					(e) => { expect(e.code).toBe(ERRORS.NOT_AUTH); }
				);
		});

		test('rejects if authenticated=true and not authenticated', () => {
			api.auth = auth;
			auth.authenticated = false;
			return api.query()
				.then(
					() => { throw new Error('Should not resolve'); },
					(e) => { expect(e.code).toBe(ERRORS.NOT_AUTH); }
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
				() => { throw new Error('Should not resolve'); },
				(e) => { expect(e).toEqual(error); }
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
				() => { throw new Error('Should not resolve'); },
				(e) => { expect(e).toEqual(error); }
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

	test('if error response data returned, reject with error', () => {
		api.requestApi = () => Promise.resolve(errorResponseData);
		return api.query()
			.then(
				() => { throw new Error('Should have rejected'); },
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
});

