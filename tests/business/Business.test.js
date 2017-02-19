import { serialize, deserialize } from 'serializr';
import Business from 'business/Business';
import Register from 'business/Register';
import Product from 'business/Product';
import ProductCategory from 'business/ProductCategory';
import TransactionMode from 'business/TransactionMode';
import Order from 'business/Order';

let business;

beforeAll(() => {
	business = new Business();
	business.deviceRegister = new Register();

	const product1 = new Product();
	product1.name = 'test-product-1';

	const product2 = new Product();
	product2.name = 'test-product-2';

	business.products.push(product1);
	business.products.push(product2);

	const productCategory1 = new ProductCategory();
	productCategory1.name = 'test-category1';
	productCategory1.products.push(product1);
	productCategory1.products.push(product2);

	const productCategory2 = new ProductCategory();
	productCategory2.name = 'test-category2';
	productCategory2.products.push(product1);

	business.productCategories.push(productCategory1);
	business.productCategories.push(productCategory2);

	business.transactionModes.push(new TransactionMode('tm-1'));
	business.transactionModes.push(new TransactionMode('tm-2'));

	business.orders.push(new Order());
	business.orders.push(new Order());
});

describe('serializing', () => {
	let data;

	beforeEach(() => {
		business.deviceRegister.employee = 'test-employee';
		data = serialize(business);
	});

	test('serializes deviceRegister', () => {
		expect(data.deviceRegister.employee).toBe(business.deviceRegister.employee);
	});

	test('serializes products', () => {
		expect(data.products.length).toBe(business.products.length);
		expect(data.products[1].name).toBe(business.products[1].name);
	});

	test('serializes productCategories', () => {
		expect(data.productCategories.length).toBe(business.productCategories.length);
		expect(data.productCategories[1].name).toBe(business.productCategories[1].name);
	});

	test('serializes transactionModes', () => {
		expect(data.transactionModes.length).toBe(business.transactionModes.length);
		expect(data.transactionModes[1].name).toBe(business.transactionModes[1].name);
	});

	test('serializes orders', () => {
		expect(data.orders.length).toBe(business.orders.length);
		expect(data.orders[1].createdAt).toEqual(expect.any(Number));
	});
});

describe('deserializing', () => {
	let newBusiness;
	const data = {
		deviceRegister: {
			employee: 'test-employee',
		},
		products: [
			{ id: 'p1', name: 'product-1' },
			{ id: 'p2' },
		],
		productCategories: [
			{
				name: 'category-1',
				products: ['p1', 'p2'],
			},
		],
		transactionModes: [
			{ name: 'tm1' },
			{ name: 'tm2' },
		],
		orders: [
			 { createdAt: (new Date()).getTime() },
			 { createdAt: (new Date()).getTime() },
		]
	};

	beforeEach(() => {
		newBusiness = deserialize(Business, data);
	});

	test('restores deviceRegister', () => {
		expect(newBusiness.deviceRegister).toBeInstanceOf(Register);
		expect(newBusiness.deviceRegister.employee).toBe(data.deviceRegister.employee);
	});

	test('restores products', () => {
		expect(newBusiness.products.length).toBe(data.products.length);
		expect(newBusiness.products[1]).toBeInstanceOf(Product);
		expect(newBusiness.products[1].id).toBe(data.products[1].id);
	});

	test('restores productCategories', () => {
		expect(newBusiness.productCategories.length).toBe(data.productCategories.length);
		expect(newBusiness.productCategories[0]).toBeInstanceOf(ProductCategory);
		expect(newBusiness.productCategories[0].name).toBe(data.productCategories[0].name);
	});

	// Tests the deserialization of ProductCategory.products
	test('restores productCategories\' products', () => {
		const productCategory = newBusiness.productCategories[0];
		expect(productCategory.products.length).toBe(data.productCategories[0].products.length);
		expect(productCategory.products[0]).toBeInstanceOf(Product);
		expect(productCategory.products[0].name).toBe(data.products[0].name);
	});

	test('restores transactionModes', () => {
		expect(newBusiness.transactionModes.length).toBe(data.transactionModes.length);
		expect(newBusiness.transactionModes[1]).toBeInstanceOf(TransactionMode);
		expect(newBusiness.transactionModes[1].name).toBe(data.transactionModes[1].name);
	});

	test('restores orders', () => {
		expect(newBusiness.orders.length).toBe(data.orders.length);
		expect(newBusiness.orders[1]).toBeInstanceOf(Order);
		expect(newBusiness.orders[1].createdAt).toBeInstanceOf(Date);
	});
});
