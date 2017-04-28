import Decimal from 'decimal.js';
import validate from 'Validator';

function validatesEmptyValue(constraints) {
	const values = [undefined, null, '', ' '];
	values.forEach((value) => {
		expect(validate({ test: value }, constraints)).toBeUndefined();
	});
}

describe('instanceOf', () => {
	test('validation', () => {
		const constraints = {
			test: {
				instanceOf: { class: Decimal },
			},
		};
		const values = {
			test: new Decimal(0),
		};

		expect(validate(values, constraints)).toBeUndefined();

		values.test = true;
		expect(validate(values, constraints)).not.toBeUndefined();

		values.test = new Date();
		expect(validate(values, constraints)).not.toBeUndefined();
	});

	test('validates empty value', () => {
		const constraints = {
			test: {
				instanceOf: { class: Decimal },
			},
		};

		validatesEmptyValue(constraints);
	});
});

describe('typeOf', () => {
	test('validates empty value', () => {
		const constraints = {
			test: {
				typeOf: 'string',
			},
		};

		validatesEmptyValue(constraints);
	});

	test('valid', () => {
		const values = {
			string: 'bonjour',
			boolean: true,
			number: 12.3,
		};

		Object.entries(values).forEach(([type, value]) => {
			const constraints = {
				test: {
					typeOf: type,
				},
			};
			const typeValues = {
				test: value,
			};
			expect(validate(typeValues, constraints)).toBeUndefined();
		});
	});

	test('invalid', () => {
		const values = {
			string: true,
			boolean: '12',
			number: true,
		};

		Object.entries(values).forEach(([type, value]) => {
			const constraints = {
				test: {
					typeOf: type,
				},
			};
			const typeValues = {
				test: value,
			};
			expect(validate(typeValues, constraints)).not.toBeUndefined();
		});
	});
});

describe('decimal', () => {
	test('validates if Decimal instance', () => {
		const constraints = {
			test: {
				decimal: true,
			},
		};
		const values = {
			test: new Decimal(3),
		};

		expect(validate(values, constraints)).toBeUndefined();

		values.test = 3;
		expect(validate(values, constraints)).not.toBeUndefined();
	});

	test('validates if gt', () => {
		const constraints = {
			test: {
				decimal: { gt: 3 },
			},
		};
		const values = {
			test: new Decimal(3.1),
		};

		expect(validate(values, constraints)).toBeUndefined();

		values.test = new Decimal(3);
		expect(validate(values, constraints)).not.toBeUndefined();
	});

	test('validates if gte', () => {
		const constraints = {
			test: {
				decimal: { gte: 3 },
			},
		};
		const values = {
			test: new Decimal(2.9),
		};

		expect(validate(values, constraints)).not.toBeUndefined();

		values.test = new Decimal(3);
		expect(validate(values, constraints)).toBeUndefined();
	});

	test('validates if lt', () => {
		const constraints = {
			test: {
				decimal: { lt: -3 },
			},
		};
		const values = {
			test: new Decimal(-3),
		};

		expect(validate(values, constraints)).not.toBeUndefined();

		values.test = new Decimal(-3.1);
		expect(validate(values, constraints)).toBeUndefined();
	});

	test('validates if lte', () => {
		const constraints = {
			test: {
				decimal: { lte: -3 },
			},
		};
		const values = {
			test: new Decimal(-2.9),
		};

		expect(validate(values, constraints)).not.toBeUndefined();

		values.test = new Decimal(-3);
		expect(validate(values, constraints)).toBeUndefined();
	});

	test('validates if int', () => {
		const constraints = {
			test: {
				decimal: { int: true },
			},
		};
		const values = {
			test: new Decimal(-2.9),
		};

		expect(validate(values, constraints)).not.toBeUndefined();

		values.test = new Decimal(-3);
		expect(validate(values, constraints)).toBeUndefined();
	});

	test('validates empty value', () => {
		const constraints = {
			test: {
				decimal: true,
			},
		};

		validatesEmptyValue(constraints);
	});
});
