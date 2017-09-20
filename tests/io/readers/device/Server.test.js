import Device from 'business/Device';
import ServerReader from 'io/readers/device/Server';

let device;
let server;
let reader;

beforeEach(() => {
	device = new Device();
	server = {
		getDevice: () => Promise.resolve(device),
	};
	reader = new ServerReader(server);
});

describe('read()', () => {
	test('returns Promise', () => {
		expect(reader.read()).toBeInstanceOf(Promise);
	});

	test('resolves with null if reader fails', (done) => {
		server.getDevice = () => Promise.reject();
		reader.read()
			.then((data) => {
				expect(data).toBeNull();
				done();
			});
	});

	test('resolves with server data', (done) => {
		reader.read()
			.then((data) => {
				expect(data).toBe(device);
				done();
			});
	});
});
