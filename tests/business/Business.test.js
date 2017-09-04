import { deserialize, serialize } from 'serializr';
import Business from 'business/Business';
import Product from 'business/Product';
import ProductCategory from 'business/ProductCategory';
import TransactionMode from 'business/TransactionMode';
import Order from 'business/Order';
import Room from 'business/Room';
import { EmailField, TextField } from 'fields/';

let business;
let subscription;

beforeEach(() => {
	business = new Business();

	const product1 = new Product();
	product1.name = 'test-product-1';

	const product2 = new Product();
	product2.name = 'test-product-2';

	business.products.push(product1);
	business.products.push(product2);

	const rootProductCategory = new ProductCategory();
	rootProductCategory.id = 9123;
	rootProductCategory.products.push(product1);
	rootProductCategory.products.push(product2);

	business.rootProductCategory = rootProductCategory;

	business.transactionModes.push(new TransactionMode('tm-1'));
	business.transactionModes.push(new TransactionMode('tm-2'));

	const room1 = new Room();
	room1.id = 8123;
	const room2 = new Room();
	room2.id = 8456;

	business.rooms.push(room1);
	business.rooms.push(room2);
});

afterEach(() => {
	if (subscription) {
		subscription.unsubscribe();
		subscription = null;
	}
});

describe('serializing', () => {
	let data;
	const textField = new TextField();
	textField.id = 8520;
	const emailField = new EmailField();
	emailField.id = 7410;

	beforeEach(() => {
		business.customerFields = [textField, emailField];
		business.roomSelectionFields = [textField, emailField];
		data = serialize(business);
	});

	test('serializes products', () => {
		expect(data.products.length).toBe(business.products.length);
		expect(data.products[1].name).toBe(business.products[1].name);
	});

	test('serializes rootProductCategory', () => {
		expect(data.rootProductCategory.id).toBe(business.rootProductCategory.id);
	});

	test('serializes transactionModes', () => {
		expect(data.transactionModes.length).toBe(business.transactionModes.length);
		expect(data.transactionModes[1].name).toBe(business.transactionModes[1].name);
	});

	test('serializes customerFields', () => {
		expect(data.customerFields.length).toBe(business.customerFields.length);
		expect(data.customerFields[1].id).toBe(business.customerFields[1].id);
	});

	test('serializes roomSelectionFields', () => {
		expect(data.roomSelectionFields.length).toBe(business.roomSelectionFields.length);
		expect(data.roomSelectionFields[1].id).toBe(business.roomSelectionFields[1].id);
	});

	test('serializes rooms', () => {
		expect(data.rooms.length).toBe(business.rooms.length);
		expect(data.rooms[1].id).toBe(business.rooms[1].id);
	});
});

describe('orderCreated', () => {
	test('emits event', (done) => {
		const order = new Order();
		business.on('newOrder', (data) => {
			expect(data).toBe(order);
			done();
		});
		business.orderCreated(order);
	});
});

describe('orderChanged', () => {
	test('emits event', (done) => {
		const order = new Order();
		const changes = {};
		business.on('orderChange', (dataOrder, dataChanges) => {
			expect(dataOrder).toBe(order);
			expect(dataChanges).toBe(changes);
			done();
		});
		business.orderChanged(order, changes);
	});
});

describe('deserializing', () => {
	let newBusiness;
	const data = {
		products: [
			{ id: 4123, name: 'product-1' },
			{ id: 4456 },
		],
		rootProductCategory: {
			id: 8123,
			name: 'category-1',
			products: [4123, 4456],
		},
		transactionModes: [
			{ name: 'tm1' },
			{ name: 'tm2' },
		],
		customerFields: [
			{ id: 369, type: 'TextField' },
			{ id: 258, type: 'EmailField' },
		],
		roomSelectionFields: [
			{ id: 147, type: 'TextField' },
			{ id: 951, type: 'EmailField' },
		],
		rooms: [
			{ id: 4456 },
			{ id: 4789 },
		],
	};

	beforeEach(() => {
		newBusiness = deserialize(Business, data);
	});

	test('restores products', () => {
		expect(newBusiness.products.length).toBe(data.products.length);
		expect(newBusiness.products[1]).toBeInstanceOf(Product);
		expect(newBusiness.products[1].id).toBe(data.products[1].id);
	});

	test('restores rootProductCategory', () => {
		expect(newBusiness.rootProductCategory).toBeInstanceOf(ProductCategory);
		expect(newBusiness.rootProductCategory.id).toBe(data.rootProductCategory.id);
	});

	// Tests the deserialization of ProductCategory.products
	test('restores rootProductCategory\'s products', () => {
		const rootCat = newBusiness.rootProductCategory;
		expect(rootCat.products.length).toBe(data.rootProductCategory.products.length);
		expect(rootCat.products[0]).toBeInstanceOf(Product);
		expect(rootCat.products[0].name).toBe(data.products[0].name);
	});

	test('restores transactionModes', () => {
		expect(newBusiness.transactionModes.length).toBe(data.transactionModes.length);
		expect(newBusiness.transactionModes[1]).toBeInstanceOf(TransactionMode);
		expect(newBusiness.transactionModes[1].name).toBe(data.transactionModes[1].name);
	});

	test('restores customerFields', () => {
		expect(newBusiness.customerFields.length).toBe(data.customerFields.length);
		expect(newBusiness.customerFields[1]).toBeInstanceOf(EmailField);
		expect(newBusiness.customerFields[1].id).toBe(data.customerFields[1].id);
	});

	test('restores roomSelectionFields', () => {
		expect(newBusiness.roomSelectionFields.length).toBe(data.roomSelectionFields.length);
		expect(newBusiness.roomSelectionFields[1]).toBeInstanceOf(EmailField);
		expect(newBusiness.roomSelectionFields[1].id).toBe(data.roomSelectionFields[1].id);
	});

	test('restores rooms', () => {
		expect(newBusiness.rooms.length).toBe(data.rooms.length);
		expect(newBusiness.rooms[1]).toBeInstanceOf(Room);
		expect(newBusiness.rooms[1].id).toBe(data.rooms[1].id);
	});
});

describe('update()', () => {
	test('replaces all attributes', () => {
		const attributes = {
			products: [],
			rootProductCategory: new ProductCategory(),
			transactionModes: [],
			customerFields: {},
			roomSelectionFields: {},
			rooms: [],
		};
		const newBusiness = new Business();
		Object.keys(attributes).forEach((attribute) => {
			newBusiness[attribute] = attributes[attribute];
		});

		business.update(newBusiness);

		Object.keys(attributes).forEach((attribute) => {
			expect(business[attribute]).toBe(attributes[attribute]);
		});
	});

	test('triggers update event', (done) => {
		business.on('update', () => { done(); });
		business.update(new Business());
	});
});
