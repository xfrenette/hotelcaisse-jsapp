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

	productCategory = new ProductCategory();
	productCategory.name = 'test-name';
	productCategory.uuid = 'test-uuid';
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
		expect(data.uuid).toBe(productCategory.uuid);
	});

	test('serializes products as uuids', () => {
		expect(data.products.length).toBe(productCategory.products.length);
		expect(data.products[1]).toBe(productCategory.products[1].uuid);
	});
});

describe('deserializing', () => {
	let newProductCategory;
	const data = {
		name: 'test-name',
		uuid: 'test-uuid',
		products: [],
	};

	beforeEach(() => {
		newProductCategory = deserialize(ProductCategory, data);
	});

	test('restores primitives', () => {
		expect(newProductCategory.name).toBe(data.name);
		expect(newProductCategory.uuid).toBe(data.uuid);
	});

	// NOTE: we cannot test here that the products array is restored, because it must reference
	// Product objects in the serialized data. This can only be tested at an upper level. See
	// BusinessData.test.js for this specific test.
});
