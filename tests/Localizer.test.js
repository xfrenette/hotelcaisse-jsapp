import Localizer from 'Localizer';

let localizer;

beforeEach(() => {
	localizer = new Localizer('fr-CA');
});

describe('constructor()', () => {
	test('sets locale', () => {
		const locale = 'fr-CA';
		localizer = new Localizer(locale);
		expect(localizer.getLocale()).toBe(locale);
	});
});

describe('formatNumber()', () => {
	test('uses locale', () => {
		const expected = '1 234,56'; // Note the special space
		const res = localizer.formatNumber(1234.56);
		expect(res).toBe(expected);
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
