import Decimal from 'decimal.js';
import { serialize } from 'serializr';
import {
	decimal,
	field,
	fieldValues,
	rawObject,
	timestamp,
	number,
} from 'vendor/serializr/propSchemas';
import { EmailField } from 'fields';

describe('decimal', () => {
	const schema = decimal();

	describe('serializer()', () => {
		test('saves decimal toString() value', () => {
			[1.23, 0, -10.2].forEach((num) => {
				const expected = new Decimal(num);
				const data = schema.serializer(expected);
				expect(data).toBe(expected.toString());
			});
		});

		test('returns null if null', () => {
			const data = schema.serializer(null);
			expect(data).toBeNull();
		});

		test('returns undefined if undefined', () => {
			const data = schema.serializer();
			expect(data).toBeUndefined();
		});

		test('throws error if not Decimal', () => {
			expect(() => {
				schema.serializer('test');
			}).toThrow();
		});
	});

	describe('deserializer', () => {
		test('returns Decimal instance', (done) => {
			const data = '1.23';
			schema.deserializer(data, (err, val) => {
				expect(val).toBeInstanceOf(Decimal);
				done();
			});
		});

		test('returns correct Decimal value', (done) => {
			const numbers = [-12.34, 0, 0.89];
			let i = 0;

			numbers.forEach((num) => {
				const expected = new Decimal(num);
				const data = schema.serializer(expected);
				i += 1;

				schema.deserializer(data, (err, val) => {
					expect(val).toEqual(expected);
					if (i === numbers.length) {
						done();
					}
				});
			});
		});

		test('returns null if null', (done) => {
			schema.deserializer(null, (err, val) => {
				expect(val).toBeNull();
				done();
			});
		});

		test('returns undefined if undefined', (done) => {
			schema.deserializer(undefined, (err, val) => {
				expect(val).toBeUndefined();
				done();
			});
		});
	});
});

describe('rawObject', () => {
	const schema = rawObject();

	describe('serializer()', () => {
		test('saves object as is', () => {
			const expected = { a: 'b', c: true, d: 3, e: null, f: [1], g: {} };
			const data = schema.serializer(expected);
			expect(data).toEqual(expected);
		});

		test('returns null if null', () => {
			const data = schema.serializer(null);
			expect(data).toBeNull();
		});

		test('returns undefined if undefined', () => {
			const data = schema.serializer();
			expect(data).toBeUndefined();
		});
	});

	describe('deserializer', () => {
		test('returns object as is', (done) => {
			const data = { a: 'b', c: true, d: 3, e: null, f: [1], g: {} };
			schema.deserializer(data, (err, val) => {
				expect(val).toEqual(data);
				done();
			});
		});

		test('returns null if null', (done) => {
			schema.deserializer(null, (err, val) => {
				expect(val).toBeNull();
				done();
			});
		});

		test('returns undefined if undefined', (done) => {
			schema.deserializer(undefined, (err, val) => {
				expect(val).toBeUndefined();
				done();
			});
		});
	});
});

describe('field', () => {
	const schema = field();
	const fieldInstance = new EmailField();
	fieldInstance.id = 357;

	describe('serializer()', () => {
		test('returns same object as serialize()', () => {
			const expected = serialize(fieldInstance);
			const data = schema.serializer(fieldInstance);
			expect(data).toEqual(expected);
		});
	});

	describe('deserializer', () => {
		test('returns correct instance', (done) => {
			const data = serialize(fieldInstance);
			schema.deserializer(data, (err, val) => {
				expect(val).toBeInstanceOf(EmailField);
				expect(val.id).toBe(fieldInstance.id);
				done();
			});
		});

		test('returns null if null', (done) => {
			schema.deserializer(null, (err, val) => {
				expect(val).toBeNull();
				done();
			});
		});

		test('returns undefined if undefined', (done) => {
			schema.deserializer(undefined, (err, val) => {
				expect(val).toBeUndefined();
				done();
			});
		});

		test('returns null if inexistant field type', (done) => {
			const data = serialize(fieldInstance);
			data.type = '__non-existent__';
			schema.deserializer(data, (err, val) => {
				expect(val).toBeNull();
				done();
			});
		});
	});
});

describe('timestamp', () => {
	const schema = timestamp();

	describe('serializer()', () => {
		test('saves timestamp', () => {
			const expected = 123456789;
			const date = new Date((123456789 * 1000) + 456);
			const data = schema.serializer(date);
			expect(data).toBe(expected);
		});

		test('returns null if null', () => {
			const data = schema.serializer(null);
			expect(data).toBeNull();
		});

		test('returns undefined if undefined', () => {
			const data = schema.serializer();
			expect(data).toBeUndefined();
		});

		test('throws error if not Date', () => {
			expect(() => {
				schema.serializer('test');
			}).toThrow();
		});
	});

	describe('deserializer', () => {
		test('returns Date instance', (done) => {
			const data = 123456789;
			schema.deserializer(data, (err, val) => {
				expect(val).toBeInstanceOf(Date);
				done();
			});
		});

		test('returns correct date value', (done) => {
			const data = 12345678;
			const expected = new Date(data * 1000);

			schema.deserializer(data, (err, val) => {
				expect(val.getTime()).toEqual(expected.getTime());
				done();
			});
		});

		test('returns null if null', (done) => {
			schema.deserializer(null, (err, val) => {
				expect(val).toBeNull();
				done();
			});
		});

		test('returns undefined if undefined', (done) => {
			schema.deserializer(undefined, (err, val) => {
				expect(val).toBeUndefined();
				done();
			});
		});
	});
});

describe('fieldValues', () => {
	const schema = fieldValues();

	describe('serializer()', () => {
		const map = new Map([
			[453, 'value1'],
			[698, true],
		]);

		test('converts map to array', () => {
			const expected = [
				{ fieldId: 453, value: 'value1' },
				{ fieldId: 698, value: true },
			];
			const data = schema.serializer(map);
			expect(data).toEqual(expected);
		});

		test('returns null if null', () => {
			const data = schema.serializer(null);
			expect(data).toBeNull();
		});

		test('returns undefined if undefined', () => {
			const data = schema.serializer();
			expect(data).toBeUndefined();
		});
	});

	describe('deserializer', () => {
		const data = [
			{ fieldId: 987, value: 'value1' },
			{ fieldId: 321, value: true },
		];

		test('returns Map instance', (done) => {
			schema.deserializer(data, (err, val) => {
				expect(val).toBeInstanceOf(Map);
				done();
			});
		});

		test('returns correct keys and values', (done) => {
			schema.deserializer(data, (err, val) => {
				expect(Array.from(val.keys())).toEqual([987, 321]);
				expect(Array.from(val.values())).toEqual(['value1', true]);
				done();
			});
		});

		test('returns null if null', (done) => {
			schema.deserializer(null, (err, val) => {
				expect(val).toBeNull();
				done();
			});
		});

		test('returns undefined if undefined', (done) => {
			schema.deserializer(undefined, (err, val) => {
				expect(val).toBeUndefined();
				done();
			});
		});
	});
});

describe('number', () => {
	const schema = number();

	describe('serializer()', () => {
		test('saves number', () => {
			const expected = 123456789;
			let data = schema.serializer(expected);
			expect(data).toBe(expected);

			data = schema.serializer(String(expected));
			expect(data).toBe(expected);
		});

		test('returns null if null', () => {
			const data = schema.serializer(null);
			expect(data).toBeNull();
		});

		test('returns undefined if undefined', () => {
			const data = schema.serializer();
			expect(data).toBeUndefined();
		});

		test('returns null if NaN', () => {
			const data = schema.serializer(Number.NaN);
			expect(data).toBeNull();
		});
	});

	describe('deserializer', () => {
		test('returns Number instance from Number', (done) => {
			const data = 123456789;
			schema.deserializer(data, (err, val) => {
				expect(val).toBe(data);
				done();
			});
		});

		test('returns Number instance from String', (done) => {
			const data = 123456789;
			schema.deserializer(String(data), (err, val) => {
				expect(val).toBe(data);
				done();
			});
		});

		test('returns NaN if not a number', (done) => {
			const data = 'a';
			schema.deserializer(data, (err, val) => {
				expect(val).toBeNaN();
				done();
			});
		});

		test('returns null if null', (done) => {
			schema.deserializer(null, (err, val) => {
				expect(val).toBeNull();
				done();
			});
		});

		test('returns undefined if undefined', (done) => {
			schema.deserializer(undefined, (err, val) => {
				expect(val).toBeUndefined();
				done();
			});
		});
	});
});
