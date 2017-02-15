import Decimal from 'decimal.js';
import { decimal } from 'vendor/serializr/propSchemas';


describe('decimal', () => {
	const schema = decimal();

	describe('serializer()', () => {
		test('saves decimal toString() value', () => {
			[1.23, 0, -10.2].forEach((number) => {
				const expected = new Decimal(number);
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

			numbers.forEach((number) => {
				const expected = new Decimal(number);
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
