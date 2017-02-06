import TransactionMode from 'business/TransactionMode';

let transactionMode;

beforeEach(() => {
	transactionMode = new TransactionMode();
});

test('it works!', () => {
	expect(transactionMode).toBeInstanceOf(TransactionMode);
});
