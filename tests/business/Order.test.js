import Order from 'business/Order';
import Item from 'business/Item';
import Product from 'business/Product';
import Transaction from 'business/Transaction';
import Credit from 'business/Credit';
import Decimal from 'decimal.js';

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
