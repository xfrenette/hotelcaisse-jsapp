import Localizer from 'Localizer';

let localizer;
const strings = {
	string: 'test-string',
	group: {
		string: 'test-group-string',
		group: {
			string: 'test-group-group-string',
		},
	},
};

beforeEach(() => {
	localizer = new Localizer('fr-CA', 'CAD');
	localizer.setStrings('fr-CA', strings);
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
});

describe('t()', () => {
	test('works with a single level', () => {
		expect(localizer.t('string')).toBe(strings.string);
	});

	test('returns path if non-existing', () => {
		[
			'nonExisting',
			'group.nonExisting',
			'group.string.nonExisting'
		].forEach((path) => {
			expect(localizer.t(path)).toBe(path);
		});
	});

	test('works multi-level', () => {
		expect(localizer.t('group.string')).toBe(strings.group.string);
		expect(localizer.t('group.group.string')).toBe(strings.group.group.string);
	});

	test('uses locale', () => {
		const enStrings = {
			group: {
				string: 'test-en-string',
			}
		};
		localizer.setStrings('en-CA', enStrings);
		// Before we change the locale
		expect(localizer.t('group.string')).toBe(strings.group.string);
		// Change locale
		localizer.locale = 'en-CA';
		expect(localizer.t('group.string')).toBe(enStrings.group.string);
		// Change locale to non-existent
		localizer.locale = 'xx-XX';
		expect(localizer.t('group.string')).toBe('group.string');
	});

	test('doesn\'t crash if no locale', () => {
		localizer = new Localizer();
		expect(localizer.t('group.string')).toBe('group.string');
	});
});
