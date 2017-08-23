import { serialize, deserialize } from 'serializr';
import ProductCategory from 'business/ProductCategory';
import Product from 'business/Product';

let productCategory;

beforeEach(() => {
	const product1 = new Product();
	product1.name = 'Product 1';
	product1.id = 1123;

	const product2 = new Product();
	product2.name = 'Product 2';
	product2.id = 2123;

	const subCategory1 = new ProductCategory();
	subCategory1.id = 1123;

	const subCategory2 = new ProductCategory();
	subCategory2.id = 2123;

	productCategory = new ProductCategory();
	productCategory.name = 'test-name';
	productCategory.id = 3123;
	productCategory.products.push(product1);
	productCategory.products.push(product2);
	productCategory.categories.push(subCategory1);
	productCategory.categories.push(subCategory2);
});

describe('serializing', () => {
	let data;

	beforeEach(() => {
		data = serialize(productCategory);
	});

	test('serializes primitives', () => {
		expect(data.name).toBe(productCategory.name);
		expect(data.id).toBe(productCategory.id);
	});

	test('serializes products as ids', () => {
		expect(data.products.length).toBe(productCategory.products.length);
		expect(data.products[1]).toBe(productCategory.products[1].id);
	});

	test('serializes categories', () => {
		expect(data.categories.length).toBe(productCategory.categories.length);
		expect(data.categories[1].id).toBe(productCategory.categories[1].id);
	});
});

describe('deserializing', () => {
	let newProductCategory;
	const data = {
		name: 'test-name',
		id: 4123,
		products: [],
		categories: [
			{ id: 5123, name: 'test-sc1-name' },
			{ id: 6123, name: 'test-sc2-name' },
		],
	};

	beforeEach(() => {
		newProductCategory = deserialize(ProductCategory, data);
	});

	test('restores primitives', () => {
		expect(newProductCategory.name).toBe(data.name);
		expect(newProductCategory.id).toBe(data.id);
	});

	test('restores categories', () => {
		expect(newProductCategory.categories.length).toBe(data.categories.length);
		expect(newProductCategory.categories[1].id).toBe(data.categories[1].id);
	});

	// NOTE: we cannot test here that the products array is restored, because it must reference
	// Product objects in the serialized data. This can only be tested at an upper level. See
	// BusinessData.test.js for this specific test.
});
