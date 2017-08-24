import Register from 'business/Register';
import ServerReader from 'io/readers/register/Server';

let register;
let server;
let reader;

beforeEach(() => {
	register = new Register();
	server = {
		getRegister: () => Promise.resolve(register),
	};
	reader = new ServerReader(server);
});

describe('read()', () => {
	test('returns Promise', () => {
		expect(reader.read()).toBeInstanceOf(Promise);
	});

	test('resolves with null if reader fails', (done) => {
		server.getRegister = () => Promise.reject();
		reader.read()
			.then((data) => {
				expect(data).toBeNull();
				done();
			});
	});

	test('resolves with server data', (done) => {
		reader.read()
			.then((data) => {
				expect(data).toBe(register);
				done();
			});
	});
});
