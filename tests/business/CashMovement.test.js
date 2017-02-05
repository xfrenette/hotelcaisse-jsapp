import CashMovement from 'business/CashMovement';
import Decimal from 'decimal.js';

describe('constructor()', () => {
	test('sets createdAt time', () => {
		const cashMovement = new CashMovement();
		expect(cashMovement.createdAt).toBeInstanceOf(Date);
	});

	test('sets amount if present', () => {
		const decimal = new Decimal(10);
		const cashMovement = new CashMovement(decimal);
		expect(cashMovement.amount).toBe(decimal);
	});

	test('doesn\'t set amount if not present', () => {
		const cashMovement = new CashMovement();
		expect(cashMovement.amount).toBeNull();
	});
});
