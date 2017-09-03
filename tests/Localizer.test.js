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
	withVariables: 'test %{a} %{b} %{c} %{a}',
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

describe('roundForCurrency', () => {
	test('uses locale', () => {
		const values = [
			// input, output
			[1.234, 1.23],
			[2, 2],
			[0.59, 0.59],
			[0.00, 0],
			[-2.5, -2.5],
			[1.2349, 1.23],
			[-1.2349, -1.23],
		];

		values.forEach((data) => {
			expect(localizer.roundForCurrency(data[0])).toBe(data[1]);
		});
	});

	test('works with local with no decimals', () => {
		localizer.setCurrency('ADP');
		expect(localizer.roundForCurrency(1.2)).toBe(1);
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

describe('formatDate()', () => {
	test('uses locale and skeleton', () => {
		const date = new Date(2017, 4, 25, 18, 59);
		const skeleton = 'yMMMd';
		const expected = '25 mai 2017';
		const res = localizer.formatDate(date, { skeleton });
		expect(res).toBe(expected);
	});
});

describe('roundForCash()', () => {
	test('rounds when applicable', () => {
		let res = localizer.roundForCash(3.52);
		expect(res).toBe(3.50);
		res = localizer.roundForCash(-3.52);
		expect(res).toBe(-3.50);
		res = localizer.roundForCash(3.53);
		expect(res).toBe(3.55);
		res = localizer.roundForCash(-3.53);
		expect(res).toBe(-3.55);
	});

	test('does not round if not applicable', () => {
		localizer.setCurrency('USD');
		let res = localizer.roundForCash(3.52);
		expect(res).toBe(3.52);
		localizer.setCurrency('BYN');
		res = localizer.roundForCash(3.52);
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
			'group.string.nonExisting',
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
			},
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

	test('replaces variables', () => {
		const variables = { c: 'C', a: 'A' };
		const expected = 'test A %{b} C A';
		expect(localizer.t('withVariables', variables)).toBe(expected);
	});
});

describe('getCurrencySymbol', () => {
	test('returns the symbol', () => {
		expect(localizer.getCurrencySymbol()).toBe('$');
	});

	test('returns null if no currency', () => {
		localizer.setCurrency(null);
		expect(localizer.getCurrencySymbol()).toBeNull();
	});
});

describe('getCurrencySymbolPosition()', () => {
	test('returns correct position', () => {
		expect(localizer.getCurrencySymbolPosition()).toBe(1);
		localizer.setLocale('en');
		localizer.setCurrency('USD');
		expect(localizer.getCurrencySymbolPosition()).toBe(-1);
	});

	test('returns -1 if no currency', () => {
		localizer.setCurrency(null);
		expect(localizer.getCurrencySymbolPosition()).toBe(-1);
	});
});

