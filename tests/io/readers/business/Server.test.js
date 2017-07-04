import Business from 'business/Business';
import ServerReader from 'io/readers/business/Server';

let business;
let server;
let reader;

beforeEach(() => {
	business = new Business();
	server = {
		getBusiness: () => Promise.resolve(business),
	};
	reader = new ServerReader(server);
});

describe('read()', () => {
	test('returns Promise', () => {
		expect(reader.read()).toBeInstanceOf(Promise);
	});

	test('resolves with null if reader fails', (done) => {
		server.getBusiness = () => Promise.reject();
		reader.read()
			.then((data) => {
				expect(data).toBeNull();
				done();
			});
	});

	test('resolves with server data', (done) => {
		reader.read()
			.then((data) => {
				expect(data).toBe(business);
				done();
			});
	});
});
