import { serialize, deserialize } from 'serializr';
import ProductCategory from 'business/ProductCategory';
import Product from 'business/Product';

let productCategory;

beforeEach(() => {
	const product1 = new Product();
	product1.name = 'Product 1';
	product1.uuid = 'p1';

	const product2 = new Product();
	product2.name = 'Product 2';
	product2.uuid = 'p2';

	const subCategory1 = new ProductCategory();
	subCategory1.uuid = 'sc1';

	const subCategory2 = new ProductCategory();
	subCategory2.uuid = 'sc2';

	productCategory = new ProductCategory();
	productCategory.name = 'test-name';
	productCategory.uuid = 'test-uuid';
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
		expect(data.uuid).toBe(productCategory.uuid);
	});

	test('serializes products as uuids', () => {
		expect(data.products.length).toBe(productCategory.products.length);
		expect(data.products[1]).toBe(productCategory.products[1].uuid);
	});

	test('serializes categories', () => {
		expect(data.categories.length).toBe(productCategory.categories.length);
		expect(data.categories[1].uuid).toBe(productCategory.categories[1].uuid);
	});
});

describe('deserializing', () => {
	let newProductCategory;
	const data = {
		name: 'test-name',
		uuid: 'test-uuid',
		products: [],
		categories: [
			{ uuid: 'sc1', name: 'test-sc1-name' },
			{ uuid: 'sc2', name: 'test-sc2-name' },
		],
	};

	beforeEach(() => {
		newProductCategory = deserialize(ProductCategory, data);
	});

	test('restores primitives', () => {
		expect(newProductCategory.name).toBe(data.name);
		expect(newProductCategory.uuid).toBe(data.uuid);
	});

	test('restores categories', () => {
		expect(newProductCategory.categories.length).toBe(data.categories.length);
		expect(newProductCategory.categories[1].uuid).toBe(data.categories[1].uuid);
	});

	// NOTE: we cannot test here that the products array is restored, because it must reference
	// Product objects in the serialized data. This can only be tested at an upper level. See
	// BusinessData.test.js for this specific test.
});
