import Order from 'business/Order';
import Item from 'business/Item';
import Product from 'business/Product';
import Transaction from 'business/Transaction';
import Credit from 'business/Credit';
import Decimal from 'decimal.js';
import { serialize, deserialize } from 'serializr';

let order;
let item1;
let item2;

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
	order.items.push(item1);
	order.items.push(item2);
	order.transactions.push(transaction1);
	order.transactions.push(transaction2);
	order.credits.push(credit1);
	order.credits.push(credit2);
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
