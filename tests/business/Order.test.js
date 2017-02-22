import { CHANNELS, TOPICS } from 'const/message-bus';
import Order from 'business/Order';
import Item from 'business/Item';
import Product from 'business/Product';
import Transaction from 'business/Transaction';
import Credit from 'business/Credit';
import Customer from 'business/Customer';
import Decimal from 'decimal.js';
import { serialize, deserialize } from 'serializr';
import postal from 'postal';

let order;
let item1;
let item2;
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
	product1.price = new Decimal(1.23);
	product1.addTax('tax1', taxes.tax1);
	product1.addTax('tax2', taxes.tax2_1);

	const product2 = new Product();
	product2.price = new Decimal(4.56);
	product2.addTax('tax2', taxes.tax2_2);
	product2.addTax('tax3', taxes.tax3);

	item1 = new Item();
	item1.product = product1;
	item1.quantity = quantities[0];

	item2 = new Item();
	item2.product = product2;
	item2.quantity = quantities[1];

	const transaction1 = new Transaction(new Decimal(12.43));
	const transaction2 = new Transaction(new Decimal(-5.23));

	const credit1 = new Credit(new Decimal(1.21));
	const credit2 = new Credit(new Decimal(0.24));

	order = new Order();
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
});

describe('taxesTotals', () => {
	test('returns an array', () => {
		expect(order.taxesTotals).toBeInstanceOf(Array);
	});

	test('returns correct array of taxes', () => {
		expect(order.taxesTotals).toEqual(taxesTotals);
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
});

describe('total', () => {
	test('returns a Decimal', () => {
		expect(order.total).toBeInstanceOf(Decimal);
	});

	test('returns expected sum', () => {
		const total = order.itemsTotal.sub(order.creditsTotal);

		expect(order.total).toEqual(total);
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
});

describe('addItem()', () => {
	test('adds to items array', () => {
		order = new Order();
		order.addItem(item1);
		expect(order.items).toEqual([item1]);
		order.addItem(item2);
		expect(order.items).toEqual([item1, item2]);
	});

	test('publishes message', (done) => {
		order = new Order();
		subscription = channel.subscribe(
			TOPICS.order.item.added,
			(data) => {
				expect(data.item).toBe(item1);
				expect(data.order).toBe(order);
				done();
			},
		);
		order.addItem(item1);
	});
});

describe('addCredit()', () => {
	const credit1 = new Credit();
	const credit2 = new Credit();

	test('adds to credits array', () => {
		order = new Order();
		order.addCredit(credit1);
		expect(order.credits).toEqual([credit1]);
		order.addCredit(credit2);
		expect(order.credits).toEqual([credit1, credit2]);
	});

	test('publishes message', (done) => {
		order = new Order();
		subscription = channel.subscribe(
			TOPICS.order.credit.added,
			(data) => {
				expect(data.credit).toBe(credit1);
				expect(data.order).toBe(order);
				done();
			},
		);
		order.addCredit(credit1);
	});
});

describe('addTransaction()', () => {
	const transaction1 = new Transaction();
	const transaction2 = new Transaction();

	test('adds to transactions array', () => {
		order = new Order();
		order.addTransaction(transaction1);
		expect(order.transactions).toEqual([transaction1]);
		order.addTransaction(transaction2);
		expect(order.transactions).toEqual([transaction1, transaction2]);
	});

	test('publishes message', (done) => {
		order = new Order();
		subscription = channel.subscribe(
			TOPICS.order.transaction.added,
			(data) => {
				expect(data.transaction).toBe(transaction1);
				expect(data.order).toBe(order);
				done();
			},
		);
		order.addTransaction(transaction1);
	});
});

describe('restoreFrom()', () => {
	const newCustomer = new Customer();
	newCustomer.name = 'new-customer-name';
	const restorationData = {
		note: 'test-note',
		items: ['a', 'b'],
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
		expect(order.items).toBe(restorationData.items);
	});

	test('restores credits', () => {
		order.restoreFrom(restorationData);
		expect(order.credits).toBe(restorationData.credits);
	});

	test('restores transactions', () => {
		order.restoreFrom(restorationData);
		expect(order.transactions).toBe(restorationData.transactions);
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

	describe('fields modified', () => {
		test('note', () => {
			order.note = `${order.note} (modif)`;
			const res = order.getChanges();
			expect(res.note).toBe(order.note);
		});

		test('items', () => {
			const newItem1 = new Item();
			const newItem2 = new Item();
			order.addItem(newItem1);
			order.addItem(newItem2);
			const res = order.getChanges();
			expect(res.items).toEqual([newItem1, newItem2]);
		});

		test('transactions', () => {
			const newTransaction1 = new Transaction();
			const newTransaction2 = new Transaction();
			order.addTransaction(newTransaction1);
			order.addTransaction(newTransaction2);
			const res = order.getChanges();
			expect(res.transactions).toEqual([newTransaction1, newTransaction2]);
		});

		test('credits', () => {
			const newCredit1 = new Credit();
			const newCredit2 = new Credit();
			order.addCredit(newCredit1);
			order.addCredit(newCredit2);
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
		expect(res.items).toEqual(order.items);
		order.addItem(new Item());
		expect(res.items.length).toBe(order.items.length - 1);
	});

	test('saves credits', () => {
		const res = order.createRestorationData();
		expect(res.credits).not.toBe(order.credits);
		expect(res.credits).toEqual(order.credits);
		order.addCredit(new Credit());
		expect(res.credits.length).toBe(order.credits.length - 1);
	});

	test('saves transactions', () => {
		const res = order.createRestorationData();
		expect(res.transactions).not.toBe(order.transactions);
		expect(res.transactions).toEqual(order.transactions);
		order.addTransaction(new Transaction());
		expect(res.transactions.length).toBe(order.transactions.length - 1);
	});

	test('saves clone of customer', () => {
		const res = order.createRestorationData();
		expect(res.customer).toBeInstanceOf(Customer);
		expect(res.customer).not.toBe(order.customer);
		expect(order.customer.isEqualTo(res.customer)).toBe(true);
	});
});

describe('serializing', () => {
	let data;

	beforeEach(() => {
		order.note = 'test-note';
		data = serialize(order);
	});

	test('serializes primitives', () => {
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
