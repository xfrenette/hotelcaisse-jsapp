import Autoloader from 'plugins/loadOnInit/Server';
import TestReader from '../../mock/TestReader';

let server;
let reader;
let serverAutoload;

beforeEach(() => {
	reader = new TestReader();
	server = { update: jest.fn() };
	serverAutoload = new Autoloader(reader, server);
});

describe('updateServer', () => {
	test('does nothing if null', () => {
		serverAutoload.updateServer(null);
		expect(server.update).not.toHaveBeenCalled();
	});

	test('does nothing if not a an object', () => {
		serverAutoload.updateServer('foo');
		expect(server.update).not.toHaveBeenCalled();
	});

	test('calls update on server', () => {
		const data = { token: 'new-token' };
		serverAutoload.updateServer(data);
		expect(server.update).toHaveBeenCalledWith(data);
	});
});

describe('start()', () => {
	test('returns Promise', () => {
		expect(serverAutoload.start()).toBeInstanceOf(Promise);
	});

	test('updates server on resolve', () => {
		const data = { token: 'new-token' };
		reader.data = data;
		return serverAutoload.start()
			.then(() => {
				expect(server.update).toHaveBeenCalledWith(data);
			});
	});
});
