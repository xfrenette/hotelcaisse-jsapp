import Product from 'business/Product';
import Decimal from 'decimal.js';

let product;

beforeEach(() => {
	product = new Product();
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
		product.name = 'test name';
		product.description = 'test description';
		product.price = new Decimal(22);
		product.addTax('tax1', new Decimal(1.22));
		product.addTax('tax2', new Decimal(2.33));

		const clone = product.clone();
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
