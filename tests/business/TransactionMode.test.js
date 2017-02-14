import TransactionMode from 'business/TransactionMode';
import { serialize, deserialize } from 'serializr';

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

describe('serializing', () => {
	test('serializes', () => {
		transactionMode.name = 'test-name';
		const data = serialize(transactionMode);
		expect(data).toEqual({
			name: transactionMode.name,
		});
	});
});

describe('deserializing', () => {
	test('deserializes', () => {
		const data = {
			name: 'test-name'
		};
		const newTransactionMode = deserialize(TransactionMode, data);
		expect(newTransactionMode).toBeInstanceOf(TransactionMode);
		expect(newTransactionMode.name).toBe(data.name);
	});
});
