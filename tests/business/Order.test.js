import { CHANNELS, TOPICS } from 'const/message-bus';
import Order from 'business/Order';
import OrderChanges from 'business/OrderChanges';
import Item from 'business/Item';
import Product from 'business/Product';
import Transaction from 'business/Transaction';
import Credit from 'business/Credit';
import Customer from 'business/Customer';
import Decimal from 'decimal.js';
import { serialize, deserialize } from 'serializr';
import { isObservable } from 'mobx';
import postal from 'postal';

let order;
let item1;
let item2;
let credit1;
let credit2;
let transaction1;
let transaction2;
const channel = postal.channel(CHANNELS.order);
let subscription;

const taxes = {
	tax1: new Decimal(0.38),
	tax2_1: new Decimal(0.45),
	tax2_2: new Decimal(0.12),
	tax3: new Decimal(1.78),
};

const quantities = [2, -1];

const taxesTotals = [
	{ name: 'tax1', amount: taxes.tax1.mul(quantities[0]) },
	{ name: 'tax2', amount: taxes.tax2_1.mul(quantities[0]).add(taxes.tax2_2.mul(quantities[1])) },
	{ name: 'tax3', amount: taxes.tax3.mul(quantities[1]) },
];

beforeEach(() => {
	const product1 = new Product();
	product1.name = 'test-product-1';
	product1.price = new Decimal(1.23);
	product1.addTax('tax1', taxes.tax1);
	product1.addTax('tax2', taxes.tax2_1);

	const product2 = new Product();
	product2.name = 'test-product-2';
	product2.price = new Decimal(4.56);
	product2.addTax('tax2', taxes.tax2_2);
	product2.addTax('tax3', taxes.tax3);

	item1 = new Item('item1');
	item1.product = product1;
	item1.quantity = quantities[0];

	item2 = new Item('item2');
	item2.product = product2;
	item2.quantity = quantities[1];

	transaction1 = new Transaction('transaction1', new Decimal(12.43));
	transaction2 = new Transaction('transaction2', new Decimal(-5.23));

	credit1 = new Credit('credit1', new Decimal(1.21), 'test-note-1');
	credit2 = new Credit('credit2', new Decimal(0.24), 'test-note-2');

	order = new Order('test-uuid');
	order.note = 'test-note';
	order.items.push(item1);
	order.items.push(item2);
	order.transactions.push(transaction1);
	order.transactions.push(transaction2);
	order.credits.push(credit1);
	order.credits.push(credit2);

	order.customer.name = 'test-customer-name';
});

afterEach(() => {
	if (subscription) {
		subscription.unsubscribe();
		subscription = null;
	}
});

describe('constructor()', () => {
	test('sets createdAt', () => {
		expect(order.createdAt).toBeInstanceOf(Date);
	});

	test('sets uuid', () => {
		const uuid = 'test-uuid';
		order = new Order(uuid);
		expect(order.uuid).toBe(uuid);
	});
});

describe('items', () => {
	test('is observable', () => {
		expect(isObservable(order, 'items')).toBe(true);
	});
});

describe('credits', () => {
	test('is observable', () => {
		expect(isObservable(order, 'credits')).toBe(true);
	});
});

describe('transactions', () => {
	test('is observable', () => {
		expect(isObservable(order, 'transactions')).toBe(true);
	});
});

describe('itemsSubtotal', () => {
	test('returns Decimal', () => {
		expect(order.itemsSubtotal).toBeInstanceOf(Decimal);
	});

	test('returns correct sum', () => {
		const sum = order.items.reduce(
			(prev, item) => prev.add(item.subtotal),
			new Decimal(0)
		);
		expect(order.itemsSubtotal.eq(sum)).toBeTruthy();
	});

	test('is observable', () => {
		expect(isObservable(order, 'itemsSubtotal')).toBe(true);
	});
});

describe('taxesTotals', () => {
	test('returns an array', () => {
		expect(order.taxesTotals).toBeInstanceOf(Array);
	});

	test('returns correct array of taxes', () => {
		expect(order.taxesTotals).toEqual(taxesTotals);
	});

	test('is observable', () => {
		expect(isObservable(order, 'taxesTotals')).toBe(true);
	});
});

describe('itemsTotal', () => {
	test('returns Decimal', () => {
		expect(order.itemsTotal).toBeInstanceOf(Decimal);
	});

	test('returns correct total', () => {
		const expected = order.items.reduce(
			(prev, item) => prev.add(item.total),
			new Decimal(0)
		);
		expect(order.itemsTotal).toEqual(expected);
	});

	test('is observable', () => {
		expect(isObservable(order, 'itemsTotal')).toBe(true);
	});
});

describe('transactionsTotal', () => {
	test('returns a Decimal', () => {
		expect(order.transactionsTotal).toBeInstanceOf(Decimal);
	});

	test('returns expected sum', () => {
		const sum = order.transactions.reduce(
			(prevSum, transaction) => prevSum.add(transaction.amount),
			new Decimal(0)
		);

		expect(order.transactionsTotal).toEqual(sum);
	});

	test('is observable', () => {
		expect(isObservable(order, 'transactionsTotal')).toBe(true);
	});
});

describe('creditsTotal', () => {
	test('returns a Decimal', () => {
		expect(order.creditsTotal).toBeInstanceOf(Decimal);
	});

	test('returns expected sum', () => {
		const sum = order.credits.reduce(
			(prevSum, credit) => prevSum.add(credit.amount),
			new Decimal(0)
		);

		expect(order.creditsTotal).toEqual(sum);
	});

	test('ignores credit if amount is null', () => {
		order.credits.clear();
		order.credits.push(new Credit('c1'));

		expect(order.creditsTotal.toNumber()).toBe(0);

		order.credits.push(new Credit('c1', new Decimal(12)));
		expect(order.creditsTotal.toNumber()).toBe(12);
	});

	test('is observable', () => {
		expect(isObservable(order, 'creditsTotal')).toBe(true);
	});
});

describe('total', () => {
	test('returns a Decimal', () => {
		expect(order.total).toBeInstanceOf(Decimal);
	});

	test('returns expected sum', () => {
		const total = order.itemsTotal.sub(order.creditsTotal);

		expect(order.total).toEqual(total);
	});

	test('is observable', () => {
		expect(isObservable(order, 'total')).toBe(true);
	});
});

describe('balance', () => {
	test('returns a Decimal', () => {
		expect(order.balance).toBeInstanceOf(Decimal);
	});

	test('returns expected sum', () => {
		const balance = order.total.sub(order.transactionsTotal);
		expect(order.balance).toEqual(balance);
	});

	test('is observable', () => {
		expect(isObservable(order, 'balance')).toBe(true);
	});
});

describe('removeItem', () => {
	test('removes based on uuid', () => {
		const itemCopy = new Item(item1.uuid);
		order.removeItem(itemCopy);
		expect(order.items.slice()).toEqual([item2]);
	});
});

describe('removeCredit', () => {
	test('removes based on uuid', () => {
		const creditCopy = new Credit(credit1.uuid);
		order.removeCredit(creditCopy);
		expect(order.credits.slice()).toEqual([credit2]);
	});
});

describe('removeTransaction', () => {
	test('removes based on uuid', () => {
		const transactionCopy = new Transaction(transaction1.uuid);
		order.removeTransaction(transactionCopy);
		expect(order.transactions.slice()).toEqual([transaction2]);
	});
});

describe('restoreFrom()', () => {
	const newCustomer = new Customer();
	newCustomer.name = 'new-customer-name';
	const restorationData = {
		note: 'test-note',
		items: [{ uuid: 'item1' }, { uuid: 'item2' }],
		credits: ['c', 'd'],
		transactions: ['e', 'f'],
		customer: newCustomer,
	};

	test('does nothing with invalid data', () => {
		order.restoreFrom();
		order.restoreFrom(null);
		order.restoreFrom(false);
		order.restoreFrom('string');
		// Should not throw any error
	});

	test('restores note', () => {
		order.restoreFrom(restorationData);
		expect(order.note).toBe(restorationData.note);
	});

	test('restores items', () => {
		order.restoreFrom(restorationData);
		expect(order.items.slice()).toEqual(restorationData.items);
	});

	test('restores credits', () => {
		order.restoreFrom(restorationData);
		expect(order.credits.slice()).toEqual(restorationData.credits);
	});

	test('restores transactions', () => {
		order.restoreFrom(restorationData);
		expect(order.transactions.slice()).toEqual(restorationData.transactions);
	});

	test('restores customer', () => {
		order.restoreFrom(restorationData);
		expect(order.customer.isEqualTo(newCustomer)).toBe(true);
	});
});

describe('revertChanges()', () => {
	test('calls restoreFrom with saves restorationData', () => {
		const data = { note: 'test-note' };
		order.restorationData = data;
		order.restoreFrom = jest.fn();
		order.revertChanges();
		expect(order.restoreFrom).toHaveBeenCalledWith(data);
	});

	test('calls stopRecordChanges()', () => {
		order.stopRecordChanges = jest.fn();
		order.revertChanges();
		expect(order.stopRecordChanges).toHaveBeenCalled();
	});
});

describe('recordChanges()', () => {
	test('sets restorationData', () => {
		const key = 'test';
		order.createRestorationData = () => key;
		order.recordChanges();
		expect(order.restorationData).toBe(key);
	});

	test('set recordingChanges', () => {
		order.recordChanges();
		expect(order.recordingChanges).toBeTruthy();
	});

	test('does nothing if already recordingChanges', () => {
		order.recordingChanges = true;
		order.createRestorationData = jest.fn();
		order.listenToChanges = jest.fn();
		order.recordChanges();
		expect(order.createRestorationData).not.toHaveBeenCalled();
		expect(order.listenToChanges).not.toHaveBeenCalled();
	});
});

describe('getChanges()', () => {
	beforeEach(() => {
		order.recordChanges();
	});

	test('works if no restorationData', () => {
		order.restorationData = null;
		order.getChanges();
		order.restorationData = false;
		order.getChanges();
		order.restorationData = 'string';
		order.getChanges();
		delete order.restorationData;
		order.getChanges();
		// Must not throw errors
	});

	test('returns OrderChanges if has changes', () => {
		order.note = `${order.note} (modif)`;
		const res = order.getChanges();
		expect(res).toBeInstanceOf(OrderChanges);
	});

	describe('fields modified', () => {
		test('note', () => {
			order.note = `${order.note} (modif)`;
			const res = order.getChanges();
			expect(res.note).toBe(order.note);
		});

		test('items', () => {
			const newItem1 = new Item();
			const newItem2 = new Item();
			order.items.push(newItem1);
			order.items.push(newItem2);
			const res = order.getChanges();
			expect(res.items).toEqual([newItem1, newItem2]);
		});

		test('transactions', () => {
			const newTransaction1 = new Transaction();
			const newTransaction2 = new Transaction();
			order.transactions.push(newTransaction1);
			order.transactions.push(newTransaction2);
			const res = order.getChanges();
			expect(res.transactions).toEqual([newTransaction1, newTransaction2]);
		});

		test('credits', () => {
			const newCredit1 = new Credit();
			const newCredit2 = new Credit();
			order.credits.push(newCredit1);
			order.credits.push(newCredit2);
			const res = order.getChanges();
			expect(res.credits).toEqual([newCredit1, newCredit2]);
		});

		test('customer', () => {
			order.customer.name = `${order.customer.name} (modif)`;
			const res = order.getChanges();
			expect(res.customer.isEqualTo(order.customer)).toBe(true);
		});
	});

	test('fields not modified', () => {
		expect(order.getChanges()).toBe(null);
	});
});

describe('stopRecordChanges()', () => {
	beforeEach(() => {
		order.recordChanges();
		order.stopRecordChanges();
	});

	test('sets recordingChanges', () => {
		expect(order.recordingChanges).toBe(false);
	});

	test('clears restorationData', () => {
		expect(order.restorationData).toBeNull();
	});
});

describe('commitChanges()', () => {
	test('calls stopRecordChanges()', () => {
		order.stopRecordChanges = jest.fn();
		order.commitChanges();
		expect(order.stopRecordChanges).toHaveBeenCalled();
	});

	test('publishes message with result from getChanges()', (done) => {
		const changes = { a: 'b' };
		order.getChanges = jest.fn().mockImplementation(() => changes);
		channel.subscribe(TOPICS.order.modified, (data) => {
			expect(data.order).toBe(order);
			expect(data.changes).toBe(changes);
			done();
		});
		order.commitChanges();
	});

	test('does not publish if no changes', () => {
		channel.subscribe(TOPICS.order.modified, () => {
			throw new Error('Should not publish message if no changes.');
		});
		order.commitChanges();
	});
});

describe('createRestorationData()', () => {
	test('saves note', () => {
		const res = order.createRestorationData();
		expect(res.note).toBe(order.note);
	});

	test('saves items', () => {
		const res = order.createRestorationData();
		expect(res.items).not.toBe(order.items);
		expect(res.items).toEqual(order.items.slice());
		order.items.push(new Item());
		expect(res.items.length).toBe(order.items.length - 1);
	});

	test('saves credits', () => {
		const res = order.createRestorationData();
		expect(res.credits).not.toBe(order.credits);
		expect(res.credits).toEqual(order.credits.slice());
		order.credits.push(new Credit());
		expect(res.credits.length).toBe(order.credits.length - 1);
	});

	test('saves transactions', () => {
		const res = order.createRestorationData();
		expect(res.transactions).not.toBe(order.transactions);
		expect(res.transactions).toEqual(order.transactions.slice());
		order.transactions.push(new Transaction());
		expect(res.transactions.length).toBe(order.transactions.length - 1);
	});

	test('saves clone of customer', () => {
		const res = order.createRestorationData();
		expect(res.customer).toBeInstanceOf(Customer);
		expect(res.customer).not.toBe(order.customer);
		expect(order.customer.isEqualTo(res.customer)).toBe(true);
	});
});

describe('trim', () => {
	test('removes items with quantity = 0', () => {
		item2.quantity = 0;
		order.trim();
		expect(order.items.length).toBe(1);
		expect(order.items[0].uuid).toBe(item1.uuid);
	});

	test('removes items with "empty" products', () => {
		const emptyProduct = new Product();
		emptyProduct.name = null;
		emptyProduct.price = null;
		item2.product = emptyProduct;
		order.trim();
		expect(order.items.length).toBe(1);
		expect(order.items[0].uuid).toBe(item1.uuid);
	});

	test('removes credits with amount = 0', () => {
		credit1.amount = new Decimal(0);
		order.trim();
		expect(order.credits.length).toBe(1);
		expect(order.credits[0].uuid).toBe(credit2.uuid);
	});

	test('removes "empty" credits', () => {
		credit1.note = null;
		credit1.amount = null;
		order.trim();
		expect(order.credits.length).toBe(1);
		expect(order.credits[0].uuid).toBe(credit2.uuid);
	});
});

describe('validate()', () => {
	test('rejects if an item is invalid', () => {
		item1.quantity = 0;
		const res = order.validate();
		expect(res).toEqual(expect.objectContaining({
			items: expect.any(Array),
		}));
	});

	test('rejects if an credit is invalid', () => {
		credit1.amount = null;
		const res = order.validate();
		expect(res).toEqual(expect.objectContaining({
			credits: expect.any(Array),
		}));
	});

	test('validates if all valid', () => {
		expect(order.validate()).toBeUndefined();
	});
});

describe('serializing', () => {
	let data;

	beforeEach(() => {
		order.note = 'test-note';
		data = serialize(order);
	});

	test('serializes primitives', () => {
		expect(data.uuid).toBe(order.uuid);
		expect(data.note).toBe(order.note);
		expect(data.createdAt).toEqual(expect.any(Number));
	});

	test('serializes items', () => {
		expect(data.items.length).toBe(order.items.length);
		expect(data.items[0].quantity).toBe(order.items[0].quantity);
	});

	test('serializes credits', () => {
		expect(data.credits.length).toBe(order.credits.length);
		expect(data.credits[0].amount).toBe(order.credits[0].amount.toString());
	});

	test('serializes transactions', () => {
		expect(data.transactions.length).toBe(order.transactions.length);
		expect(data.transactions[0].amount).toBe(order.transactions[0].amount.toString());
	});
});

describe('deserializing', () => {
	let newOrder;
	const data = {
		uuid: 'test-uuid',
		createdAt: (new Date()).getTime(),
		note: 'order-note',
		items: [
			{ quantity: 2 },
			{ quantity: 1 },
		],
		credits: [
			{ note: 'credit-1-note' },
			{ note: 'credit-2-note' },
		],
		transactions: [
			{ note: 'transaction-1-note' },
			{ note: 'transaction-2-note' },
		],
	};

	beforeEach(() => {
		newOrder = deserialize(Order, data);
	});

	test('restores primitives', () => {
		expect(newOrder.createdAt).toBeInstanceOf(Date);
		expect(newOrder.uuid).toBe(data.uuid);
		expect(newOrder.note).toBe(data.note);
	});

	test('restores items', () => {
		expect(newOrder.items.length).toBe(data.items.length);
		expect(newOrder.items[1]).toBeInstanceOf(Item);
		expect(newOrder.items[1].quantity).toBe(data.items[1].quantity);
	});

	test('restores credits', () => {
		expect(newOrder.credits.length).toBe(data.credits.length);
		expect(newOrder.credits[1]).toBeInstanceOf(Credit);
		expect(newOrder.credits[1].note).toBe(data.credits[1].note);
	});

	test('restores transactions', () => {
		expect(newOrder.transactions.length).toBe(data.transactions.length);
		expect(newOrder.transactions[1]).toBeInstanceOf(Transaction);
		expect(newOrder.transactions[1].note).toBe(data.transactions[1].note);
	});
});
