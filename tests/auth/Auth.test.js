import { isObservable } from 'mobx';
import Auth from 'auth/Auth';

let auth;

beforeEach(() => {
	auth = new Auth();
});

describe('authenticated', () => {
	test('is observable', () => {
		expect(isObservable(auth, 'authenticated')).toBe(true);
	});
});
