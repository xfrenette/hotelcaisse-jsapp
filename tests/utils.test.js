import utils from 'utils';

describe('stringInterpolation()', () => {
	test('replaces variable', () => {
		const string = 'test %{aaa} test';
		const expected = 'test AAA test';
		const variables = { aaa: 'AAA' };
		expect(utils.stringInterpolation(string, variables)).toBe(expected);
	});

	test('replaces all instances', () => {
		const string = 'test %{aaa} test %{aaa}';
		const expected = 'test AAA test AAA';
		const variables = { aaa: 'AAA' };
		expect(utils.stringInterpolation(string, variables)).toBe(expected);
	});

	test('does not replace variables that start the same', () => {
		const string = 'test %{aaab} test %{aaa}';
		const expected = 'test %{aaab} test AAA';
		const variables = { aaa: 'AAA' };
		expect(utils.stringInterpolation(string, variables)).toBe(expected);
	});

	test('does nothing with non-corresponding variables', () => {
		const string = 'test %{aaa} test';
		const variables = { bbb: 'BBB' };
		expect(utils.stringInterpolation(string, variables)).toBe(string);
	});
});
