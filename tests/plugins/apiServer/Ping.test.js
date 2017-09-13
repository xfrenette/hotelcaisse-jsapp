import Ping from 'plugins/apiServer/Ping';
import Server from 'servers/Api';
import Application from 'Application';

let ping;
let server;

beforeEach(() => {
	server = new Server();

	ping = new Ping(server);
	ping.bootstrap(new Application());
});

describe('start', () => {
	test('calls startPings', () => {
		ping.startPings = jest.fn();
		ping.start();
		expect(ping.startPings).toHaveBeenCalled();
	});
});

describe('startPings', () => {
	test('calls ping at interval', (done) => {
		const interval = 100;
		let count = 0;
		let startTime;

		server.ping = jest.fn(() => {
			count += 1;

			if (count === 3) {
				ping.stopPings();
				const endTime = new Date();
				const diff = endTime.getTime() - startTime.getTime();
				expect(diff).toBeLessThan(count * interval);
				expect(diff).toBeGreaterThanOrEqual((count - 1) * interval);
				done();
			}
		});

		startTime = new Date();
		ping.interval = interval;
		ping.startPings();
	});
});
