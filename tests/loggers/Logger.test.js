import Logger from 'loggers/Logger';

let logger;
const logMethods = ['error', 'warn', 'info', 'debug', 'trace'];

beforeEach(() => {
	logger = new Logger();
});

describe('getNamespace()', () => {
	test('returns an object will all methods', () => {
		const res = logger.getNamespace('test');
		logMethods.forEach((method) => {
			expect(res[method]).toBeInstanceOf(Function);
		});
	});

	test('calls Logger log method with correct params', () => {
		const namespace = 'test';
		const message = 'test-message';
		const data = { a: 'b' };

		logger.log = jest.fn();
		const res = logger.getNamespace(namespace);
		res.debug(message, data);

		expect(logger.log).toHaveBeenCalledWith('debug', namespace, message, data);
	});

	test('Logger.log method is called with the Logger as thisArg', () => {
		let thisArg = null;
		logger.log = function() {
			thisArg = this;
		};
		const res = logger.getNamespace('test');
		res.debug('test');
		expect(thisArg).toBe(logger);
	});
});
