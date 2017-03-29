import ApiWithToken, { ERRORS } from 'auth/ApiWithToken';
import { ERRORS as AUTH_ERRORS } from 'auth/Auth';
import { Response } from 'node-fetch';
import FormData from 'form-data';

global.FormData = FormData;

let apiWithToken;

beforeEach(() => {
	const apiURL = 'https://api.example.com/1.0/auth';
	apiWithToken = new ApiWithToken();
	apiWithToken.apiURL = apiURL;
});

describe('validateAPIResponse()', () => {
	test('returns Promise', () => {
		const res = ApiWithToken.validateAPIResponse({});
		res.catch(() => { /* do nothing */ });
		expect(res instanceof Promise).toBe(true);
	});

	test('rejects if response.ok is false', (done) => {
		const response = { ok: false };
		ApiWithToken.validateAPIResponse(response)
			.catch((error) => {
				expect(error.code).toBe(ERRORS.SERVER_ERROR);
				done();
			});
	});

	test('rejects with invalid json', (done) => {
		const response = new Response('invalid, {json}');

		ApiWithToken.validateAPIResponse(response)
			.catch((error) => {
				expect(error.code).toBe(ERRORS.INVALID_RESPONSE);
				done();
			});
	});

	test('rejects if json does not contain valid data', (done) => {
		const response = new Response('{}');

		ApiWithToken.validateAPIResponse(response)
			.catch((error) => {
				expect(error.code).toBe(ERRORS.INVALID_RESPONSE);
				done();
			});
	});

	test('resolves if valid data', (done) => {
		const data = {
			status: 'ok',
			data: {
				token: 'test-token',
			},
		};
		const response = new Response(JSON.stringify(data));

		ApiWithToken.validateAPIResponse(response)
			.then((responseData) => {
				expect(responseData).toEqual(data);
				done();
			});
	});
});

describe('isResponseDataValid()', () => {
	test('returns false if does not contain status', () => {
		const data = { data: {} };
		expect(ApiWithToken.isResponseDataValid(data)).toBe(false);
	});

	test('returns false if does not contain data', () => {
		const data = { status: 'ok' };
		expect(ApiWithToken.isResponseDataValid(data)).toBe(false);
	});

	test('returns false if ok but no token', () => {
		const data = { status: 'ok', data: {} };
		expect(ApiWithToken.isResponseDataValid(data)).toBe(false);
	});

	test('returns false if error but no error code', () => {
		let data = { status: 'error' };
		expect(ApiWithToken.isResponseDataValid(data)).toBe(false);
		data = { status: 'error', error: {} };
		expect(ApiWithToken.isResponseDataValid(data)).toBe(false);
	});

	test('returns true with valid ok response', () => {
		const data = { status: 'ok', data: { token: 'test-token' } };
		expect(ApiWithToken.isResponseDataValid(data)).toBe(true);
	});

	test('returns true with valid error response', () => {
		const data = { status: 'error', error: { code: 'test-code' } };
		expect(ApiWithToken.isResponseDataValid(data)).toBe(true);
	});
});

describe('processResponseData()', () => {
	test('rejects if status is error', (done) => {
		const data = { status: 'error', error: { code: 'test-code' } };
		apiWithToken.processResponseData(data)
			.catch((error) => {
				expect(error.code).toBe(AUTH_ERRORS.AUTHENTICATION_FAILED);
				done();
			});
	});

	test('resolves if status is ok', (done) => {
		const data = { status: 'ok', data: { token: 'test-token' } };
		apiWithToken.processResponseData(data)
			.then(() => { done(); });
	});

	test('sets token if status is ok', (done) => {
		const data = { status: 'ok', data: { token: 'test-token' } };
		apiWithToken.processResponseData(data)
			.then(() => {
				expect(apiWithToken.token).toBe(data.data.token);
				done();
			});
	});
});

describe('doAuthenticateRequest()', () => {
	test('calls API url with params', () => {
		global.fetch = jest.fn().mockImplementation(() => Promise.resolve());
		apiWithToken.doAuthenticateRequest('test', 'test')
			.catch(() => {});
		expect(global.fetch).toHaveBeenCalledWith(
			apiWithToken.apiURL,
			{
				method: 'POST',
				cache: 'no-cache',
				body: expect.any(FormData),
			}
		);
	});

	test('rejects on network error', (done) => {
		global.fetch = () => Promise.reject('error');

		apiWithToken.doAuthenticateRequest('test', 'test')
			.catch((error) => {
				expect(error.code).toBe(ERRORS.NETWORK_ERROR);
				done();
			});
	});

	test('resolves when valid response', (done) => {
		const data = {
			status: 'ok',
			data: {
				token: 'test-token',
			},
		};
		global.fetch = () => Promise.resolve(new Response(JSON.stringify(data)));
		apiWithToken.doAuthenticateRequest('test', 'test')
			.then(() => {
				expect(apiWithToken.token).toBe(data.data.token);
				done();
			});
	});
});

describe('invalidate()', () => {
	test('sets authenticate to false', () => {
		apiWithToken.authenticated = true;
		apiWithToken.invalidate();
		expect(apiWithToken.authenticated).toBe(false);
	});

	test('clears token', () => {
		apiWithToken.token = 'test-token';
		apiWithToken.invalidate();
		expect(apiWithToken.token).toBeNull();
	});
});

describe('authenticate()', () => {
	global.fetch = () => Promise.reject('reason');

	test('returns Promise', () => {
		const res = apiWithToken.authenticate('test', 'test');
		expect(res instanceof Promise).toBe(true);
	});

	test('calls invalidate', () => {
		apiWithToken.invalidate = jest.fn();
		apiWithToken.authenticate('test', 'test');
		expect(apiWithToken.invalidate).toHaveBeenCalled();
	});

	test('calls doAuthenticateRequest()', () => {
		const code = 'test-code';
		const deviceUUID = 'test-uuid';
		apiWithToken.doAuthenticateRequest = jest.fn().mockImplementation(() => Promise.resolve());
		apiWithToken.authenticate(code, deviceUUID);
		expect(apiWithToken.doAuthenticateRequest).toHaveBeenCalledWith(code, deviceUUID);
	});

	test('sets authenticate to true if successful', (done) => {
		const code = 'test-code';
		const deviceUUID = 'test-uuid';
		apiWithToken.doAuthenticateRequest = jest.fn().mockImplementation(() => Promise.resolve());
		apiWithToken.authenticate(code, deviceUUID)
			.then(() => {
				expect(apiWithToken.authenticated).toBe(true);
				done();
			});
	});
});

describe('constructor()', () => {
	test('sets apiURL', () => {
		const url = 'test-url';
		apiWithToken = new ApiWithToken(url);
		expect(apiWithToken.apiURL).toBe(url);
	});
});
