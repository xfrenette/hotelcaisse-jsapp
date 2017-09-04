import { CHANNELS, TOPICS } from 'const/message-bus';
import Order from 'business/Order';
import OrderChanges from 'business/OrderChanges';
import Item from 'business/Item';
import Product from 'business/Product';
import Transaction from 'business/Transaction';
import RoomSelection from 'business/RoomSelection';
import Room from 'business/Room';
import Credit from 'business/Credit';
import Customer from 'business/Customer';
import Decimal from 'decimal.js';
import { TextField } from 'fields';
import { deserialize, serialize } from 'serializr';
import { isObservable } from 'mobx';
import postal from 'postal';
import AppliedTax from '../../src/business/AppliedTax';
import Localizer from '../../src/Localizer';

let order;
let item1;
let item2;
let credit1;
let credit2;
let transaction1;
let transaction2;
let roomSelection1;
let roomSelection2;
const channel = postal.channel(CHANNELS.order);
let subscription;
let customerField;

const taxes = {
	tax1: new AppliedTax(1123, 'tax 1', new Decimal(0.3849)),
	tax2_1: new AppliedTax(1456, 'tax 2', new Decimal(0.45)),
	tax2_2: new AppliedTax(1456, 'tax 2', new Decimal(0.12)), // Same taxId as tax2_1
	tax3: new AppliedTax(1741, 'tax 3', new Decimal(1.78)),
};

const quantities = [2, -1];

const taxesTotals = [
	new AppliedTax(taxes.tax1.taxId, taxes.tax1.name, taxes.tax1.amount.mul(quantities[0])),
	new AppliedTax(taxes.tax2_1.taxId, taxes.tax2_1.name, taxes.tax2_1.amount.mul(quantities[0])
		.add(taxes.tax2_2.amount.mul(quantities[1]))),
	new AppliedTax(taxes.tax3.taxId, taxes.tax3.name, taxes.tax3.amount.mul(quantities[1])),
];

beforeEach(() => {
	const product1 = new Product();
	product1.name = 'test-product-1';
	product1.price = new Decimal(1.23);
	product1.taxes.push(taxes.tax1);
	product1.taxes.push(taxes.tax2_1);

	const product2 = new Product();
	product2.name = 'test-product-2';
	product2.price = new Decimal(4.56);
	product2.taxes.push(taxes.tax2_2);
	product2.taxes.push(taxes.tax3);

	item1 = new Item('item1');
	item1.product = product1;
	item1.quantity = quantities[0];

	item2 = new Item('item2');
	item2.product = product2;
	item2.quantity = quantities[1];

	transaction1 = new Transaction('transaction1', new Decimal(12.43));
	transaction2 = new Transaction('transaction2', new Decimal(-5.23));

	roomSelection1 = new RoomSelection();
	roomSelection1.uuid = 'room-selection-1';
	roomSelection1.room = new Room();
	roomSelection2 = new RoomSelection();
	roomSelection2.uuid = 'room-selection-2';
	roomSelection2.room = new Room();

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
	order.roomSelections.push(roomSelection1);
	order.roomSelections.push(roomSelection2);

	customerField = new TextField();
	customerField.id = 99789;

	order.customer.setFieldValue(customerField, 'test-value');
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

describe('roomSelections', () => {
	test('is observable', () => {
		expect(isObservable(order, 'roomSelections')).toBe(true);
	});
});

describe('note', () => {
	test('is observable', () => {
		expect(isObservable(order, 'note')).toBe(true);
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
		const actual = serialize(order.taxesTotals);
		const expected = serialize(taxesTotals);
		expect(actual).toEqual(expected);
	});

	test('is observable', () => {
		expect(isObservable(order, 'taxesTotals')).toBe(true);
	});

	test('if currency, rounds values per tax', () => {
		order.calculateRawTaxesTotals = () => [
			new AppliedTax(1, 'tax1', new Decimal(1.2351)),
			new AppliedTax(2, 'tax2', new Decimal(5.2349999)),
		];
		order.localizer = new Localizer('fr-CA', 'CAD');
		const res = order.taxesTotals;
		expect(res[0].amount.toNumber()).toBe(1.24);
		expect(res[1].amount.toNumber()).toBe(5.23);
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

	test('if currency, rounds values', () => {
		order.localizer = new Localizer('fr-CA', 'CAD');
		const res = order.itemsTotal;
		expect(res.toNumber()).toBe(-2.33);
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

	test('returns total from items sub total and taxesTotal', () => {
		const product = new Product();
		product.price = new Decimal(1);
		// When rounded individually (expected behavior), the 2 taxes are 0.00 each (and a total
		// of 0.00). If we round the total (not wanted), the total would be 0.01
		product.taxes.push(new AppliedTax(1, 'tax1', new Decimal(0.0024))); // For a quantity of 2
		product.taxes.push(new AppliedTax(2, 'tax2', new Decimal(0.0024)));
		const item = new Item();
		item.product = product;
		item.quantity = 2;
		order = new Order();
		order.items.push(item);
		order.localizer = new Localizer('fr-CA', 'CAD');

		// The total of the taxes is supposed to be 0, so we expect the total to be the total
		// without taxes
		const total = order.itemsSubtotal;
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

	test('is observable', () => {
		expect(isObservable(order, 'balance')).toBe(true);
	});
});

describe('earliestCheckInDate', () => {
	beforeEach(() => {
		order.roomSelections.clear();
	});

	test('returns null if no roomSelection', () => {
		expect(order.earliestCheckInDate).toBeNull();
	});

	test('returns null if roomSelection has no startDate', () => {
		roomSelection1.startDate = null;
		order.roomSelections.push(roomSelection1);
		expect(order.earliestCheckInDate).toBeNull();
	});

	test('returns earliest startDate of roomSelections', () => {
		const latest = new Date();
		const earliest = new Date(latest.getTime() - 10000);

		roomSelection1.startDate = latest;
		order.roomSelections.push(roomSelection1);
		roomSelection2.startDate = earliest;
		order.roomSelections.push(roomSelection2);

		expect(order.earliestCheckInDate.getTime()).toEqual(earliest.getTime());
	});

	test('works with roomSelection with null startDate', () => {
		const date = new Date();

		roomSelection1.startDate = null;
		order.roomSelections.push(roomSelection1);
		roomSelection2.startDate = date;
		order.roomSelections.push(roomSelection2);

		expect(order.earliestCheckInDate.getTime()).toEqual(date.getTime());
	});

	test('is observable', () => {
		expect(isObservable(order, 'earliestCheckInDate')).toBe(true);
	});
});

describe('latestCheckOutDate', () => {
	beforeEach(() => {
		order.roomSelections.clear();
	});

	test('returns null if no roomSelection', () => {
		expect(order.latestCheckOutDate).toBeNull();
	});

	test('returns null if roomSelection has no endDate', () => {
		roomSelection1.endDate = null;
		order.roomSelections.push(roomSelection1);
		expect(order.latestCheckOutDate).toBeNull();
	});

	test('returns latest endDate of roomSelections', () => {
		const latest = new Date();

		roomSelection1.endDate = new Date(latest.getTime() - 10000);
		order.roomSelections.push(roomSelection1);
		roomSelection2.endDate = latest;
		order.roomSelections.push(roomSelection2);

		expect(order.latestCheckOutDate.getTime()).toEqual(latest.getTime());
	});

	test('works with roomSelection with null endDate', () => {
		const date = new Date();

		roomSelection1.endDate = null;
		order.roomSelections.push(roomSelection1);
		roomSelection2.endDate = date;
		order.roomSelections.push(roomSelection2);

		expect(order.latestCheckOutDate.getTime()).toEqual(date.getTime());
	});

	test('is observable', () => {
		expect(isObservable(order, 'latestCheckOutDate')).toBe(true);
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

describe('removeRoomSelection', () => {
	test('removes based on uuid', () => {
		const roomSelectionCopy = new RoomSelection();
		roomSelectionCopy.uuid = roomSelection1.uuid;
		order.removeRoomSelection(roomSelectionCopy);
		expect(order.roomSelections.slice()).toEqual([roomSelection2]);
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
		roomSelections: ['g', 'h'],
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

	test('restores roomSelections', () => {
		order.restoreFrom(restorationData);
		expect(order.roomSelections.slice()).toEqual(restorationData.roomSelections);
	});

	test('restores customer', () => {
		order.restoreFrom(restorationData);
		expect(order.customer.equals(newCustomer)).toBe(true);
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
			expect(res.fieldChanged('note')).toBeTruthy();
		});

		test('items', () => {
			const newItem1 = new Item();
			const newItem2 = new Item();
			order.items.push(newItem1);
			order.items.push(newItem2);
			const res = order.getChanges();
			expect(res.items).toEqual([newItem1, newItem2]);
			expect(res.fieldChanged('items')).toBeTruthy();
		});

		test('transactions', () => {
			const newTransaction1 = new Transaction();
			const newTransaction2 = new Transaction();
			order.transactions.push(newTransaction1);
			order.transactions.push(newTransaction2);
			const res = order.getChanges();
			expect(res.transactions).toEqual([newTransaction1, newTransaction2]);
			expect(res.fieldChanged('transactions')).toBeTruthy();
		});

		test('customer', () => {
			order.customer.fieldValues.set('test-modif', true);
			const res = order.getChanges();
			expect(res.customer.equals(order.customer)).toBe(true);
			expect(res.customer).not.toBe(order.customer);
			expect(res.fieldChanged('customer')).toBeTruthy();
		});

		describe('roomSelections', () => {
			test('change attribute of one', () => {
				const roomSelection = order.roomSelections[0];
				roomSelection.startDate = new Date(1);
				const res = order.getChanges();
				expect(res.roomSelections).not.toBe(order.roomSelections);
				expect(res.roomSelections).toEqual(order.roomSelections.slice());
				expect(res.fieldChanged('roomSelections')).toBeTruthy();
			});

			test('add one', () => {
				order.roomSelections.push(new RoomSelection());
				const res = order.getChanges();
				expect(res.roomSelections).not.toBe(order.roomSelections);
				expect(res.roomSelections).toEqual(order.roomSelections.slice());
				expect(res.fieldChanged('roomSelections')).toBeTruthy();
			});

			test('delete one', () => {
				order.roomSelections.pop();
				const res = order.getChanges();
				expect(res.roomSelections).not.toBe(order.roomSelections);
				expect(res.roomSelections).toEqual(order.roomSelections.slice());
				expect(res.fieldChanged('roomSelections')).toBeTruthy();
			});
		});

		describe('credits', () => {
			test('change attribute of one', () => {
				const credit = order.credits[0];
				credit.amount = credit.amount.add(1);
				const res = order.getChanges();
				expect(res.credits).not.toBe(order.credits);
				expect(res.credits).toEqual(order.credits.slice());
				expect(res.fieldChanged('credits')).toBeTruthy();
			});

			test('add one', () => {
				order.credits.push(new Credit());
				const res = order.getChanges();
				expect(res.credits).not.toBe(order.credits);
				expect(res.credits).toEqual(order.credits.slice());
				expect(res.fieldChanged('credits')).toBeTruthy();
			});

			test('delete one', () => {
				order.credits.pop();
				const res = order.getChanges();
				expect(res.credits).not.toBe(order.credits);
				expect(res.credits).toEqual(order.credits.slice());
				expect(res.fieldChanged('credits')).toBeTruthy();
			});
		});
	});

	test('fields not modified', () => {
		expect(order.getChanges().hasChanges()).toBeFalsy();
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

	test('emits "change" event with changes', (done) => {
		const changes = { a: 'b' };
		order.on('change', (c) => {
			expect(c).toEqual(changes);
			done();
		});
		order.getChanges = jest.fn().mockImplementation(() => changes);
		order.commitChanges();
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
		expect(order.customer.equals(res.customer)).toBe(true);
	});

	test('saves roomSelections as clones', () => {
		const res = order.createRestorationData();
		expect(res.roomSelections).not.toBe(order.roomSelections);
		expect(res.roomSelections[0]).not.toBe(order.roomSelections[0]);
		expect(res.roomSelections[0]).toBeInstanceOf(RoomSelection);
	});

	test('saves credits as clones', () => {
		const res = order.createRestorationData();
		expect(res.credits).not.toBe(order.credits);
		expect(res.credits[0]).not.toBe(order.credits[0]);
		expect(res.credits[0]).toBeInstanceOf(Credit);
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

describe('freeze', () => {
	test('calls freeze on items', () => {
		order = new Order();
		const mock = jest.fn();

		for (let i = 0; i < 2; i += 1) {
			const item = new Item();
			item.freeze = mock;
			order.items.push(item);
		}

		order.freeze();
		expect(mock).toHaveBeenCalledTimes(2);
	});

	test('calls freeze on roomSelections', () => {
		order = new Order();
		const mock = jest.fn();

		for (let i = 0; i < 2; i += 1) {
			const roomSelection = new RoomSelection();
			roomSelection.freeze = mock;
			order.roomSelections.push(roomSelection);
		}

		order.freeze();
		expect(mock).toHaveBeenCalledTimes(2);
	});

	test('calls freeze on transactions', () => {
		order = new Order();
		const mock = jest.fn();

		for (let i = 0; i < 2; i += 1) {
			const transaction = new Transaction();
			transaction.freeze = mock;
			order.transactions.push(transaction);
		}

		order.freeze();
		expect(mock).toHaveBeenCalledTimes(2);
	});
});

describe('validate()', () => {
	test('only validates specified attributes', () => {
		// Make only items invalid
		item1.quantity = 0;
		// The credits defined in the beforeEach are already valid
		expect(order.validate(['credits'])).toBeUndefined();
	});

	describe('items', () => {
		test('rejects if an item is invalid', () => {
			item1.quantity = 0;
			const res = order.validate(['items']);
			expect(res).toEqual(expect.objectContaining({
				items: expect.any(Array),
			}));
		});

		test('validates if all valid', () => {
			// The items defined in the beforeEach are already valid
			expect(order.validate(['items'])).toBeUndefined();
		});
	});

	describe('credits', () => {
		test('rejects if a credit is invalid', () => {
			credit1.amount = null;
			const res = order.validate(['credits']);
			expect(res).toEqual(expect.objectContaining({
				credits: expect.any(Array),
			}));
		});

		test('validates if all valid', () => {
			// The credits defined in the beforeEach are already valid
			expect(order.validate(['credits'])).toBeUndefined();
		});
	});

	describe('customer', () => {
		test('rejects if no customer', () => {
			order.customer = null;
			const res = order.validate(['customer']);
			expect(res).toEqual(expect.objectContaining({
				customer: expect.any(Array),
			}));
		});

		test('rejects if the customer is in error', () => {
			customerField.required = true;
			order.customer.fields = [customerField];
			order.customer.setFieldValue(customerField, '');
			const res = order.validate(['customer']);
			expect(res).toEqual(expect.objectContaining({
				customer: expect.any(Array),
			}));
		});

		test('validates if all valid', () => {
			expect(order.validate(['customer'])).toBeUndefined();
		});
	});

	describe('roomSelections', () => {
		test('valid if no roomSelections', () => {
			order.roomSelections.clear();
			expect(order.validate(['roomSelections'])).toBeUndefined();
		});

		test('rejects if a roomSelection is in error', () => {
			roomSelection2.room = null;
			const res = order.validate(['roomSelections']);
			expect(res).toEqual(expect.objectContaining({
				roomSelections: expect.any(Array),
			}));
		});

		test('validates if all valid', () => {
			expect(order.validate(['roomSelections'])).toBeUndefined();
		});
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
		expect(data.createdAt).toEqual(Math.round(order.createdAt.getTime() / 1000));
	});

	test('serializes customer', () => {
		expect(data.customer).toEqual(serialize(order.customer));
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

	test('serializes roomSelections', () => {
		expect(data.roomSelections.length).toBe(order.roomSelections.length);
		expect(data.roomSelections[0].uuid).toBe(order.roomSelections[0].uuid);
	});
});

describe('deserializing', () => {
	let newOrder;
	const data = {
		uuid: 'test-uuid',
		createdAt: Math.round((new Date()).getTime() / 1000),
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
		roomSelections: [
			{ uuid: 'uuid-room-selection-1' },
			{ uuid: 'uuid-room-selection-2' },
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

	test('restores roomSelections', () => {
		expect(newOrder.roomSelections.length).toBe(data.roomSelections.length);
		expect(newOrder.roomSelections[1]).toBeInstanceOf(RoomSelection);
		expect(newOrder.roomSelections[1].uuid).toBe(data.roomSelections[1].uuid);
	});
});
