import Product from 'business/Product';
import Decimal from 'decimal.js';
import { serialize, deserialize } from 'serializr';
import { isObservable } from 'mobx';

let product;

beforeEach(() => {
	product = new Product();
});

describe('price', () => {
	test('is observable', () => {
		expect(isObservable(product, 'price')).toBe(true);
	});
});

describe('hasVariants', () => {
	test('returns true if has variants', () => {
		const variant = new Product();
		product.addVariant(variant);
		expect(product.hasVariants).toBe(true);
	});

	test('returns false if has no variant', () => {
		expect(product.hasVariants).toBe(false);
	});
});

describe('extendedName', () => {
	test('works with variant', () => {
		product.name = 'Parent product';
		const variant = new Product();
		variant.name = 'Variant product';
		product.addVariant(variant);
		const extendedName = variant.extendedName;

		expect(extendedName).toEqual(expect.stringMatching(new RegExp(product.name)));
		expect(extendedName).toEqual(expect.stringMatching(new RegExp(variant.name)));
	});

	test('returns name if not a variant', () => {
		product.name = 'Parent product';
		expect(product.extendedName).toEqual(product.name);
	});
});

describe('addVariant()', () => {
	test('adds the variant', () => {
		const variant = new Product();
		product.addVariant(variant);
		expect(product.hasVariants).toBe(true);
	});

	test('sets the parent of the variant', () => {
		const variant = new Product();
		product.addVariant(variant);
		expect(variant.parent).toBe(product);
	});
});

describe('isVariant', () => {
	test('returns true if a variant', () => {
		const parent = new Product();
		parent.addVariant(product);
		expect(product.isVariant).toBe(true);
	});

	test('returns false if not a variant', () => {
		expect(product.isVariant).toBe(false);
	});
});

describe('addTax()', () => {
	test('adds a new tax', () => {
		const tax = {
			name: 'tax-test',
			amount: new Decimal(123),
		};
		product.addTax(tax.name, tax.amount);
		expect(product.taxes).toEqual([tax]);
	});
});

describe('clone()', () => {
	test('clone is new instance', () => {
		const clone = product.clone();
		expect(clone).not.toBe(product);
	});

	test('clones properties', () => {
		product.id = 6123;
		product.name = 'test name';
		product.description = 'test description';
		product.price = new Decimal(22);
		product.addTax('tax1', new Decimal(1.22));
		product.addTax('tax2', new Decimal(2.33));

		const clone = product.clone();
		expect(clone.id).toBe(product.id);
		expect(clone.name).toBe(product.name);
		expect(clone.description).toBe(product.description);
		expect(clone.price.eq(product.price)).toBeTruthy();
		expect(clone.taxes).toEqual(product.taxes);
		expect(clone.taxes).not.toBe(product.taxes);
	});

	test('works with null price', () => {
		const clone = product.clone();
		expect(clone.price).toBeNull();
	});
});

describe('serializing', () => {
	let data;

	beforeEach(() => {
		product.id = 3654;
		product.name = 'test-name';
		product.description = 'test-description';
		product.price = new Decimal(12.34);
		product.addTax('tax1', new Decimal(5.25));
		product.addTax('tax2', new Decimal(8.14));
		product.parent = { id: 6985 };
		data = serialize(product);
	});

	test('saves primitives', () => {
		expect(data.id).toBe(product.id);
		expect(data.name).toBe(product.name);
		expect(data.description).toBe(product.description);
	});

	test('saves price', () => {
		expect(typeof data.price).toBe('string');
	});

	test('saves taxes', () => {
		expect(data.taxes.length).toBe(product.taxes.length);
		expect(data.taxes[0]).toEqual({
			name: product.taxes[0].name,
			amount: product.taxes[0].amount.toString(),
		});
	});

	test('saves variants', () => {
		const variant = new Product();
		variant.name = 'test-variant-name';
		product.addVariant(variant);
		data = serialize(product);
		expect(data.variants.length).toBe(1);
		expect(data.variants[0].name).toBe(variant.name);
	});

	test('saves parent', () => {
		expect(data.parent).toBe(product.parent.id);
	});
});

describe('deserializing', () => {
	const id = 7321;
	const data = {
		id,
		name: 'test-name',
		description: 'test-description',
		price: '12.34',
		taxes: [
			{ name: 'tax1', amount: '1.23' },
			{ name: 'tax2', amount: '4.56' },
		],
		variants: [
			{ id: 1233, parent: id },
			{ id: 9652, parent: id },
		],
	};

	beforeEach(() => {
		product = deserialize(Product, data);
	});

	test('restores primitives', () => {
		expect(product.id).toBe(data.id);
		expect(product.name).toBe(data.name);
		expect(product.description).toBe(data.description);
	});

	test('restores price', () => {
		expect(product.price).toBeInstanceOf(Decimal);
		expect(product.price.toString()).toBe(data.price);
	});

	test('restores taxes', () => {
		expect(product.taxes.length).toBe(data.taxes.length);
		expect(product.taxes[0].name).toBe(data.taxes[0].name);
		expect(product.taxes[0].amount.toString()).toBe(data.taxes[0].amount);
	});

	test('restores variants', () => {
		expect(product.variants.length).toBe(data.variants.length);
		const variant = product.variants[0];
		expect(variant).toBeInstanceOf(Product);
		expect(variant.id).toBe(data.variants[0].id);
		expect(variant.parent).toBe(product);
	});
});

describe('validate()', () => {
	test('validates name and price', () => {
		product.name = ' ';
		product.price = new Decimal(0);
		const res = product.validate();
		expect(res).toEqual(expect.objectContaining({
			name: expect.any(Array),
			price: expect.any(Array),
		}));
	});
});

describe('static validate()', () => {
	test('rejects invalid name', () => {
		const invalidValues = [undefined, null, 12, '', ' '];
		invalidValues.forEach((value) => {
			expect(Product.validate({ name: value })).not.toBeUndefined();
		});
	});

	test('rejects invalid price', () => {
		const invalidValues = [undefined, null, 12, '12', new Decimal(-1), new Decimal(0)];
		invalidValues.forEach((value) => {
			expect(Product.validate({ price: value })).not.toBeUndefined();
		});
	});

	test('validates valid data', () => {
		const values = { price: new Decimal(12), name: 'Test' };
		expect(Product.validate(values)).toBeUndefined();
	});
});
