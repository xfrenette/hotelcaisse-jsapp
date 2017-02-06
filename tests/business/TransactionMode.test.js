import TransactionMode from 'business/TransactionMode';

let transactionMode;

beforeEach(() => {
	transactionMode = new TransactionMode();
});

describe('constructor()', () => {
	test('it sets name if supplied', () => {
		const name = 'test-name';
		transactionMode = new TransactionMode(name);
		expect(transactionMode.name).toBe(name);
	});
});
