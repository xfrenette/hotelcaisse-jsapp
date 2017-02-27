import postal from 'postal';
import { CHANNELS, TOPICS } from 'const/message-bus';
import Api, { ERRORS } from 'io/writers/Api';
import { Response } from 'node-fetch';
import TestAuth from '../../auth/TestAuth';

let api;
let auth;
const pubChannel = postal.channel(CHANNELS.api);
let subscription;

beforeEach(() => {
	const url = 'https://api.example.com/1.0/';
	auth = new TestAuth();
	api = new Api(url, auth);
});

afterEach(() => {
	if (subscription) {
		subscription.unsubscribe();
		subscription = null;
	}
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
	test('uses url and channel', () => {
		const channel = 'test-channel';
		const res = api.buildRequestURL(channel);
		expect(res).toBe(`${api.url}/${channel}`);
	});

	test('works without channel', () => {
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

describe('publishSuccessData()', () => {
	test('publishes data', (done) => {
		const data = { a: 'test' };
		subscription = pubChannel.subscribe(TOPICS.api.dataReceived.success, (receivedData) => {
			expect(receivedData).toEqual(data);
			done();
		});
		Api.publishSuccessData(data);
	});
});

describe('publishErrorData()', () => {
	test('publishes data', (done) => {
		const data = { a: 'test' };
		subscription = pubChannel.subscribe(TOPICS.api.dataReceived.error, (receivedData) => {
			expect(receivedData).toEqual(data);
			done();
		});
		Api.publishErrorData(data);
	});
});

describe('doRequest()', () => {
	test('returns Promise', () => {
		global.fetch = () => Promise.resolve();
		const res = api.doRequest({}, 'test');
		expect(res).toBeInstanceOf(Promise);
	});

	test('calls fetch with correct URL', () => {
		const channel = 'test-channel';
		const expectedUrl = api.buildRequestURL(channel);
		global.fetch = jest.fn().mockImplementation(() => Promise.reject());
		api.doRequest({}, channel)
			.catch(() => {});
		expect(fetch).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
	});

	test('calls fetch with correct init', (done) => {
		const data = { a: 'b' };
		const expected = api.buildRequestBody(data);
		global.fetch = (url, init) => {
			expect(init.method).toEqual('POST');
			expect(init.cache).toEqual('no-cache');
			expect(init.body).toEqual(expected);
			done();
			return Promise.reject();
		};
		api.doRequest({})
			.catch(() => {});
	});

	test('rejects when fetch rejects', (done) => {
		global.fetch = () => Promise.reject({});
		api.doRequest({})
			.catch((error) => {
				expect(error.code).toBe(ERRORS.NETWORK_ERROR);
				done();
			});
	});

	test('rejects if receives invalid response', (done) => {
		const response = new Response('invalid {json}');
		global.fetch = () => Promise.resolve(response);
		api.doRequest({})
			.catch((error) => {
				expect(error.code).toBe(ERRORS.INVALID_RESPONSE);
				done();
			});
	});

	test('rejects if receives error response', (done) => {
		const response = new Response('{"status":"error"}');
		global.fetch = () => Promise.resolve(response);
		api.doRequest({})
			.catch((error) => {
				expect(error.code).toBe(ERRORS.RESPONSE_ERROR);
				done();
			});
	});

	test('resolves with success response', (done) => {
		const response = new Response('{"status":"ok"}');
		global.fetch = () => Promise.resolve(response);
		api.doRequest({})
			.then(() => {
				done();
			});
	});

	test('calls publishSuccessData on success', (done) => {
		const responseData = {
			status: 'ok',
			data: { a: 'bb' },
		};
		const response = new Response(JSON.stringify(responseData));
		global.fetch = () => Promise.resolve(response);
		subscription = pubChannel.subscribe(TOPICS.api.dataReceived.success, (receivedData) => {
			expect(receivedData).toEqual(responseData.data);
			done();
		});
		api.doRequest({});
	});

	test('calls publishErrorData on error', (done) => {
		const responseData = {
			status: 'error',
			error: { a: 'bb' },
		};
		const response = new Response(JSON.stringify(responseData));
		global.fetch = () => Promise.resolve(response);
		subscription = pubChannel.subscribe(TOPICS.api.dataReceived.error, (receivedData) => {
			expect(receivedData).toEqual(responseData.error);
			done();
		});
		api.doRequest({}).catch(() => {});
	});
});

describe('write', () => {
	global.fetch = () => Promise.reject('test');

	test('returns Promise', () => {
		const res = api.write({}, 'test');
		res.catch(() => {});
		expect(res).toBeInstanceOf(Promise);
	});

	test('rejects if not authenticated', (done) => {
		auth.authenticated = false;
		const res = api.write({}, 'test');
		res.catch((error) => {
			expect(error.code).toBe(ERRORS.NOT_AUTHENTICATED);
			done();
		});
	});

	test('calls doRequest with params', () => {
		const data = { a: 'bb' };
		const channel = 'test-channel';
		api.doRequest = jest.fn().mockImplementation(() => Promise.resolve({}));
		api.write(data, channel);
		expect(api.doRequest).toHaveBeenCalledWith(data, channel);
	});
});
