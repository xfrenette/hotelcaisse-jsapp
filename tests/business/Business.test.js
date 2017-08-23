import { serialize, deserialize } from 'serializr';
import { isObservable } from 'mobx';
import postal from 'postal';
import { CHANNELS, TOPICS } from 'const/message-bus';
import Business from 'business/Business';
import Register from 'business/Register';
import Product from 'business/Product';
import CashMovement from 'business/CashMovement';
import ProductCategory from 'business/ProductCategory';
import TransactionMode from 'business/TransactionMode';
import Order from 'business/Order';
import Room from 'business/Room';
import Decimal from 'decimal.js';
import { TextField, EmailField } from 'fields/';

let business;
const channel = postal.channel(CHANNELS.business);
let subscription;

beforeEach(() => {
	business = new Business();
	business.deviceRegister = new Register();

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

	business.orders.push(new Order());
	business.orders.push(new Order());

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

describe('emits registerOpen', () => {
	test('with new deviceRegister', (done) => {
		business.on('registerOpen', () => {
			done();
		});
		const register = new Register();
		business.deviceRegister = register;
		register.open('test', new Decimal(1));
	});

	test('current deviceRegister changes state', (done) => {
		business.on('registerOpen', () => {
			done();
		});
		business.deviceRegister.open('test', new Decimal(1));
	});
});

describe('emits registerClose', () => {
	test('with new deviceRegister', (done) => {
		business.on('registerClose', () => {
			done();
		});
		const register = new Register();
		business.deviceRegister = register;
		register.close(new Decimal(1), 'test', new Decimal(1));
	});

	test('current deviceRegister changes state', (done) => {
		business.on('registerClose', () => {
			done();
		});
		business.deviceRegister.close(new Decimal(1), 'test', new Decimal(1));
	});
});

test('emits cashMovementAdd', (done) => {
	const cashMovement = new CashMovement();
	business.on('cashMovementAdd', (cm) => {
		expect(cm).toBe(cashMovement);
		done();
	});
	business.deviceRegister.addCashMovement(cashMovement);
});

test('emits cashMovementRemove', (done) => {
	const cashMovement = new CashMovement();
	business.on('cashMovementRemove', (cm) => {
		expect(cm).toBe(cashMovement);
		done();
	});
	business.deviceRegister.addCashMovement(cashMovement);
	business.deviceRegister.removeCashMovement(cashMovement);
});

describe('emits orderChange', () => {
	const changes = { a: 'b' };
	let order;

	beforeEach(() => {
		order = new Order();
		order.getChanges = jest.fn().mockImplementation(() => changes);
	});

	test('with order added by addOrder', (done) => {
		business.on('orderChange', (o, c) => {
			expect(o).toBe(order);
			expect(c).toEqual(changes);
			done();
		});
		business.addOrder(order);
		order.commitChanges();
	});

	test('with order added directly on orders', (done) => {
		business.on('orderChange', (o, c) => {
			expect(o).toBe(order);
			expect(c).toEqual(changes);
			done();
		});
		business.orders.push(order);
		order.commitChanges();
	});

	test('does not trigger event when order is removed', () => {
		business.on('orderChange', () => {
			expect(false).toBe(true);
		});

		business.orders.push(order);
		business.orders.clear();
		order.commitChanges();

		business.orders.push(order);
		business.orders.replace([]);
		order.commitChanges();
	});
});

describe('addOrder()', () => {
	test('adds to orders array', () => {
		business = new Business();
		const order = new Order();
		business.addOrder(order);
		expect(business.orders.slice()).toEqual([order]);
	});

	test('emits newOrder', (done) => {
		const order = new Order();
		business.on('newOrder', (o) => {
			expect(o).toBe(order);
			done();
		});
		business.addOrder(order);
	});

	test('publishes message', (done) => {
		const order = new Order();
		subscription = channel.subscribe(
			TOPICS.business.order.added,
			(data) => {
				expect(data.business).toBe(business);
				expect(data.order).toBe(order);
				done();
			}
		);
		business.addOrder(order);
	});
});

describe('serializing', () => {
	let data;
	const textField = new TextField();
	textField.uuid = 'text-field';
	const emailField = new EmailField();
	emailField.uuid = 'email-field';

	beforeEach(() => {
		business.deviceRegister.employee = 'test-employee';
		business.customerFields = [textField, emailField];
		business.roomSelectionFields = [textField, emailField];
		data = serialize(business);
	});

	test('serializes deviceRegister', () => {
		expect(data.deviceRegister.employee).toBe(business.deviceRegister.employee);
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

	test('serializes orders', () => {
		expect(data.orders.length).toBe(business.orders.length);
		expect(data.orders[1].createdAt).toEqual(expect.any(Number));
	});

	test('serializes customerFields', () => {
		expect(data.customerFields.length).toBe(business.customerFields.length);
		expect(data.customerFields[1].uuid).toBe(business.customerFields[1].uuid);
	});

	test('serializes roomSelectionFields', () => {
		expect(data.roomSelectionFields.length).toBe(business.roomSelectionFields.length);
		expect(data.roomSelectionFields[1].uuid).toBe(business.roomSelectionFields[1].uuid);
	});

	test('serializes rooms', () => {
		expect(data.rooms.length).toBe(business.rooms.length);
		expect(data.rooms[1].id).toBe(business.rooms[1].id);
	});
});

describe('deserializing', () => {
	let newBusiness;
	const data = {
		deviceRegister: {
			employee: 'test-employee',
		},
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
		orders: [
			{ createdAt: (new Date()).getTime() },
			{ createdAt: (new Date()).getTime() },
		],
		customerFields: [
			{ uuid: 'field-1', type: 'TextField' },
			{ uuid: 'field-2', type: 'EmailField' },
		],
		roomSelectionFields: [
			{ uuid: 'field-3', type: 'TextField' },
			{ uuid: 'field-4', type: 'EmailField' },
		],
		rooms: [
			{ id: 4456 },
			{ id: 4789 },
		],
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

	test('restores orders', () => {
		expect(newBusiness.orders.length).toBe(data.orders.length);
		expect(newBusiness.orders[1]).toBeInstanceOf(Order);
		expect(newBusiness.orders[1].createdAt).toBeInstanceOf(Date);
	});

	test('restores customerFields', () => {
		expect(newBusiness.customerFields.length).toBe(data.customerFields.length);
		expect(newBusiness.customerFields[1]).toBeInstanceOf(EmailField);
		expect(newBusiness.customerFields[1].uuid).toBe(data.customerFields[1].uuid);
	});

	test('restores roomSelectionFields', () => {
		expect(newBusiness.roomSelectionFields.length).toBe(data.roomSelectionFields.length);
		expect(newBusiness.roomSelectionFields[1]).toBeInstanceOf(EmailField);
		expect(newBusiness.roomSelectionFields[1].uuid).toBe(data.roomSelectionFields[1].uuid);
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
			deviceRegister: new Register(),
			products: [],
			rootProductCategory: new ProductCategory(),
			transactionModes: [],
			orders: [],
			customerFields: {},
			roomSelectionFields: {},
			rooms: [],
		};
		const newBusiness = new Business();
		Object.keys(attributes).forEach((attribute) => {
			if (attribute === 'orders') {
				newBusiness.orders.replace(attributes.orders);
			} else {
				newBusiness[attribute] = attributes[attribute];
			}
		});

		business.update(newBusiness);

		Object.keys(attributes).forEach((attribute) => {
			if (attribute === 'orders') {
				expect(business.orders.slice()).toEqual(attributes.orders);
			} else {
				expect(business[attribute]).toBe(attributes[attribute]);
			}
		});
	});
});

test('deviceRegister is observable', () => {
	expect(isObservable(business, 'deviceRegister')).toBe(true);
});
