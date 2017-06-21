import Api, { ERRORS } from 'servers/Api';
import { Response } from 'node-fetch';
import TestAuth from '../mock/TestAuth';

let api;
let auth;
const validResponse = new Response('{"status":"ok"}');

beforeEach(() => {
	const url = 'https://api.example.com/1.0';
	auth = new TestAuth();
	api = new Api(url, auth);
});

describe('constructor()', () => {
	test('sets url', () => {
		const url = 'test-url';
		api = new Api(url);
		expect(api.url).toBe(url);
	});

	test('sets apiAuth', () => {
		api = new Api('test', auth);
		expect(api.apiAuth).toBe(auth);
	});
});

describe('buildRequestURL()', () => {
	test('uses url and path', () => {
		const path = 'test-path';
		const res = api.buildRequestURL(path);
		expect(res).toBe(`${api.url}/${path}`);
	});

	test('uses params if set', () => {
		const params = { a: 'b', c: 'd' };
		const res = api.buildRequestURL(null, params);
		expect(res).toBe(`${api.url}?a=b&c=d`);
	});

	test('encodes params', () => {
		const params = { a: '?', c: '&' };
		const res = api.buildRequestURL(null, params);
		expect(res).toBe(`${api.url}?a=%3F&c=%26`);
	});

	test('works without path', () => {
		const expected = api.url;
		let res = api.buildRequestURL();
		expect(res).toBe(expected);
		res = api.buildRequestURL(null);
		expect(res).toBe(expected);
	});
});

describe('buildRequestBody()', () => {
	test('returns FormData', () => {
		expect(api.buildRequestBody({})).toBeInstanceOf(FormData);
	});

	test('contains data as JSON', () => {
		const data = {
			aa: 'bb',
			cc: true,
			dd: { ee: ['ff'] },
		};
		const res = api.buildRequestBody(data);
		expect(res.get('data')).toEqual(JSON.stringify(data));
	});

	test('contains lastDataVersion number', () => {
		api.lastDataVersion = 'test-version-number';
		const res = api.buildRequestBody({});
		expect(res.get('lastDataVersion')).toEqual(api.lastDataVersion);
	});

	test('contains token', () => {
		auth.token = 'test-token';
		const res = api.buildRequestBody({});
		expect(res.get('token')).toEqual(auth.token);
	});
});

describe('validateResponse()', () => {
	test('returns Promise', () => {
		const res = Api.validateResponse({});
		res.catch(() => {});
		expect(res).toBeInstanceOf(Promise);
	});

	test('rejects if response.ok is false', (done) => {
		const response = { ok: false };
		Api.validateResponse(response)
			.catch((error) => {
				expect(error.code).toBe(ERRORS.SERVER_ERROR);
				done();
			});
	});

	test('rejects if invalid json', (done) => {
		const response = new Response('invalid, {json}');
		Api.validateResponse(response)
			.catch((error) => {
				expect(error.code).toBe(ERRORS.INVALID_RESPONSE);
				done();
			});
	});

	test('rejects if response does not contain status', (done) => {
		const response = new Response('{"aa":true}');
		Api.validateResponse(response)
			.catch((error) => {
				expect(error.code).toBe(ERRORS.INVALID_RESPONSE);
				done();
			});
	});

	test('resolves with data object', (done) => {
		const data = {
			status: 'ok',
			cc: true,
			data: {
				aa: 'bb',
			},
		};
		const response = new Response(JSON.stringify(data));
		Api.validateResponse(response)
			.then((responseData) => {
				expect(responseData).toEqual(data);
				done();
			});
	});
});

describe('processResponseData()', () => {
	test('updates lastDataVersion', (done) => {
		const data = {
			status: 'ok',
			dataVersion: 'test-data-version',
		};
		api.lastDataVersion = '1';
		api.processResponseData(data)
			.then(() => {
				expect(api.lastDataVersion).toBe(data.dataVersion);
				done();
			});
	});

	test('does not update lastDataVersion if not there', (done) => {
		const version = 'test';
		api.lastDataVersion = version;
		api.processResponseData({ status: 'ok' })
			.then(() => {
				expect(api.lastDataVersion).toBe(version);
				done();
			});
	});

	test('resolves with data when success', (done) => {
		const data = {
			status: 'ok',
			data: { test: 'aa' },
		};
		api.processResponseData(data)
			.then((processedData) => {
				expect(processedData).toEqual(data.data);
				done();
			});
	});

	test('resolves with null if no data key', (done) => {
		api.processResponseData({ status: 'ok' })
			.then((processedData) => {
				expect(processedData).toBeNull();
				done();
			});
	});

	test('rejects when status is error', (done) => {
		const data = {
			status: 'error',
			error: {
				code: 'test-code',
				message: 'test-message',
				userMessage: 'test-user-message',
			},
		};
		api.processResponseData(data)
			.catch((error) => {
				expect(error.code).toEqual(ERRORS.RESPONSE_ERROR);
				expect(error.data).toEqual(data.error);
				done();
			});
	});
});

describe('doRequest()', () => {
	test('returns Promise', () => {
		global.fetch = () => Promise.resolve(validResponse);
		const res = api.doRequest('GET', {}, 'test');
		expect(res).toBeInstanceOf(Promise);
	});

	test('fetch body is null if method is not POST', (done) => {
		const method = 'GET';
		global.fetch = (url, init) => {
			expect(init.body).toBeFalsy();
			done();
			return Promise.reject();
		};
		api.doRequest(method, { a: 'b' })
			.catch(() => {});
	});

	test('calls fetch with correct URL', () => {
		const path = 'test-path';
		const data = { a: 'b', c: '&' };
		const expectedUrl = api.buildRequestURL(path, data);
		global.fetch = jest.fn().mockImplementation(() => Promise.reject());
		api.doRequest('GET', data, path)
			.catch(() => {});
		expect(fetch).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
	});

	test('calls fetch with correct init', (done) => {
		const data = { a: 'b' };
		const expected = api.buildRequestBody(data);
		const method = 'POST';
		global.fetch = (url, init) => {
			expect(init.method).toEqual(method);
			expect(init.cache).toEqual('no-cache');
			expect(init.body).toEqual(expected);
			done();
			return Promise.reject();
		};
		api.doRequest(method, {})
			.catch(() => {});
	});

	test('rejects when fetch rejects', (done) => {
		global.fetch = () => Promise.reject({});
		api.doRequest('GET', {})
			.catch((error) => {
				expect(error.code).toBe(ERRORS.NETWORK_ERROR);
				done();
			});
	});

	test('rejects if receives invalid response', (done) => {
		const response = new Response('invalid {json}');
		global.fetch = () => Promise.resolve(response);
		api.doRequest('GET', {})
			.catch((error) => {
				expect(error.code).toBe(ERRORS.INVALID_RESPONSE);
				done();
			});
	});

	test('rejects if receives error response', (done) => {
		const response = new Response('{"status":"error"}');
		global.fetch = () => Promise.resolve(response);
		api.doRequest('GET', {})
			.catch((error) => {
				expect(error.code).toBe(ERRORS.RESPONSE_ERROR);
				done();
			});
	});

	test('resolves with success response', (done) => {
		const response = new Response('{"status":"ok"}');
		global.fetch = () => Promise.resolve(response);
		api.doRequest('GET', {})
			.then(() => {
				done();
			});
	});
});

describe('query', () => {
	global.fetch = () => Promise.reject('test');

	test('returns Promise', () => {
		const res = api.query(null, {}, 'test');
		res.catch(() => {});
		expect(res).toBeInstanceOf(Promise);
	});

	test('rejects if not authenticated', (done) => {
		auth.authenticated = false;
		const res = api.query(null, {}, 'test');
		res.catch((error) => {
			expect(error.code).toBe(ERRORS.NOT_AUTHENTICATED);
			done();
		});
	});

	test('calls doRequest with params', () => {
		const data = { a: 'bb' };
		const path = 'test-path';
		const method = 'GET';
		api.doRequest = jest.fn().mockImplementation(() => Promise.resolve({}));
		api.query(method, data, path);
		expect(api.doRequest).toHaveBeenCalledWith(method, data, path);
	});
});
