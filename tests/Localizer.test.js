import Localizer from 'Localizer';

let localizer;

beforeEach(() => {
	localizer = new Localizer('fr-CA', 'CAD');
});

describe('constructor()', () => {
	test('sets locale', () => {
		const locale = 'fr-CA';
		localizer = new Localizer(locale);
		expect(localizer.getLocale()).toBe(locale);
	});

	test('sets currency', () => {
		const currency = 'CAD';
		localizer = new Localizer(null, currency);
		expect(localizer.getCurrency()).toBe(currency);
	});
});

describe('formatNumber()', () => {
	test('uses locale', () => {
		const expected = '1 234,56'; // Note the special space
		const res = localizer.formatNumber(1234.56);
		expect(res).toBe(expected);
	});

	test('accepts options', () => {
		const expected = '3,5600';
		const options = { minimumFractionDigits: 4 };
		const res = localizer.formatNumber(3.56, options);
		expect(res).toBe(expected);
	});
});

describe('formatCurrency()', () => {
	test('uses locale and currency', () => {
		const expected = '1,25 $';
		const res = localizer.formatCurrency(1.25);
		expect(res).toBe(expected);
	});

	test('accepts options', () => {
		const expected = '3,55 $';
		const options = { round: 'floor' };
		const res = localizer.formatCurrency(3.557, options);
		expect(res).toBe(expected);
	});
});

describe('roundForCurrency()', () => {
	test('rounds when applicable', () => {
		let res = localizer.roundForCurrency(3.52);
		expect(res).toBe(3.50);
		res = localizer.roundForCurrency(-3.52);
		expect(res).toBe(-3.50);
		res = localizer.roundForCurrency(3.53);
		expect(res).toBe(3.55);
		res = localizer.roundForCurrency(-3.53);
		expect(res).toBe(-3.55);
	});

	test('does not round if not applicable', () => {
		localizer.setCurrency('USD');
		let res = localizer.roundForCurrency(3.52);
		expect(res).toBe(3.52);
		localizer.setCurrency('BYN');
		res = localizer.roundForCurrency(3.52);
		expect(res).toBe(3.52);
	});
});

describe('parseNumber()', () => {
	test('uses locale', () => {
		const value = '1 234,56';
		const res = localizer.parseNumber(value);
		expect(res).toBe(1234.56);
	});
});

describe('getDecimalSeparator', () => {
	test('returns separator for locale', () => {
		expect(localizer.getDecimalSeparator()).toBe(',');
	});
})
