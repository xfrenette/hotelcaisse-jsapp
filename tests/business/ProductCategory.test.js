import { serialize, deserialize } from 'serializr';
import ProductCategory from 'business/ProductCategory';
import Product from 'business/Product';

let productCategory;

beforeEach(() => {
	const product1 = new Product();
	product1.name = 'Product 1';
	product1.id = 'p1';

	const product2 = new Product();
	product2.name = 'Product 2';
	product2.id = 'p2';

	productCategory = new ProductCategory();
	productCategory.name = 'test-name';
	productCategory.products.push(product1);
	productCategory.products.push(product2);
});

describe('serializing', () => {
	let data;

	beforeEach(() => {
		data = serialize(productCategory);
	});

	test('serializes primitives', () => {
		expect(data.name).toBe(productCategory.name);
	});

	test('serializes products as ids', () => {
		expect(data.products.length).toBe(productCategory.products.length);
		expect(data.products[1]).toBe(productCategory.products[1].id);
	});
});

describe('deserializing', () => {
	let newProductCategory;
	const data = {
		name: 'test-name',
		products: [],
	};

	beforeEach(() => {
		newProductCategory = deserialize(ProductCategory, data);
	});

	test('restores primitives', () => {
		expect(newProductCategory.name).toBe(data.name);
	});

	// NOTE: we cannot test here that the products array is restored, because it must reference
	// Product objects in the serialized data. This can only be tested at an upper level. See
	// BusinessData.test.js for this specific test.
});
