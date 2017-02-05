import Credit from 'business/Credit';
import Decimal from 'decimal.js';

describe('constructor()', () => {
	test('sets createdAt time', () => {
		const credit = new Credit();
		expect(credit.createdAt).toBeInstanceOf(Date);
	});

	test('sets amount if present', () => {
		const decimal = new Decimal(10);
		const credit = new Credit(decimal);
		expect(credit.amount).toBe(decimal);
	});

	test('doesn\'t set amount if not present', () => {
		const credit = new Credit();
		expect(credit.amount).toBeNull();
	});
});
