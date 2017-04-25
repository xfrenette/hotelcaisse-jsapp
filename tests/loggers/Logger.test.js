import Logger from 'loggers/Logger';

let logger;
const baseMethods = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];
const allMethods = [...baseMethods, 'log'];

beforeEach(() => {
	logger = new Logger();
});

describe('withNamespace()', () => {
	test('returns an object with methods calling original ones', () => {
		allMethods.forEach((method) => {
			logger[method] = jest.fn();
		});

		const withNamespace = logger.withNamespace('test');

		allMethods.forEach((method) => {
			const params = ['a', 'b'];
			expect(withNamespace[method]).toBeInstanceOf(Function);
			withNamespace[method].call(withNamespace, ...params);
			expect(logger[method]).toHaveBeenCalled();
		});
	});

	test('uses namespace in message', () => {
		const namespace = 'test';
		const message = 'test-message';
		const expected = `${namespace} : ${message}`;
		const withNamespace = logger.withNamespace(namespace);

		baseMethods.forEach((method) => {
			logger[method] = jest.fn();
			withNamespace[method].call(withNamespace, message, true);
			expect(logger[method]).toHaveBeenCalledWith(expected, true);
		});
	});
});
