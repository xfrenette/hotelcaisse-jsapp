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
