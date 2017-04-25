import winston from 'winston';
import util from 'util';
import WinstonLogger from 'loggers/WinstonLogger';

let logger;
let testTransportOutput = '';
const TestTransport = winston.transports.TestTransport = function() {
	this.name = 'test';
	this.level = 'info';
};

util.inherits(TestTransport, winston.Transport);

TestTransport.prototype.log = function(level, msg, meta, callback) {
	testTransportOutput = msg;
	callback(null, true);
};

beforeEach(() => {
	logger = new WinstonLogger();
});

describe('addTransport()', () => {
	test('adds a transport', () => {
		const msg = 'addTransport-test';
		logger.addTransport(TestTransport);
		logger.error(msg);
		expect(testTransportOutput).toBe(msg);
	});
});
