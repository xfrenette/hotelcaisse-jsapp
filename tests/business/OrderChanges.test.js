import { deserialize, serialize } from 'serializr';
import OrderChanges from 'business/OrderChanges';
import Order from 'business/Order';
import Item from 'business/Item';
import Customer from 'business/Customer';
import Credit from 'business/Credit';
import Transaction from 'business/Transaction';
import RoomSelection from 'business/RoomSelection';

let changes;

beforeEach(() => {
	changes = new OrderChanges();
});

describe('setField', () => {
	test('sets field', () => {
		const value = 'new-note';
		changes.setField('note', value);
		expect(changes.note).toBe(value);
		expect(changes.changedFields).toEqual(['note']);
	});

	test('changedFields does not contain repetition', () => {
		changes.setField('note', '1');
		changes.setField('customer', new Customer());
		changes.setField('note', '2');
		expect(changes.changedFields).toEqual(['note', 'customer']);
	});
});

describe('fieldChanged', () => {
	test('returns expected value', () => {
		changes.setField('customer', new Customer());
		expect(changes.fieldChanged('note')).toBeFalsy();
		changes.setField('note', 'New note');
		expect(changes.fieldChanged('note')).toBeTruthy();
	});
});

describe('hasChanges', () => {
	test('returns expected value', () => {
		expect(changes.hasChanges()).toBeFalsy();
		changes.setField('note', 'New note');
		expect(changes.hasChanges()).toBeTruthy();
	});
});

describe('serializing', () => {
	let data;

	beforeEach(() => {
		changes.setField('note', 'test-note');
		changes.setField('customer', new Customer());
		changes.customer.setFieldValue({ id: 1123, value: 'test1' });
		changes.setField('items', [new Item('test-item')]);
		changes.setField('credits', [new Credit('test-credit')]);
		changes.setField('transactions', [new Transaction('test-transaction')]);
		changes.setField('roomSelections', [new RoomSelection('test-room-selection')]);
		data = serialize(changes);
	});

	test('serializes primitives', () => {
		expect(data.note).toBe(changes.note);
		expect(data.changedFields).toEqual(['note', 'customer', 'items', 'credits', 'transactions', 'roomSelections']);
	});

	test('serializes customer', () => {
		expect(data.customer).toEqual(serialize(changes.customer));
	});

	test('serializes items', () => {
		expect(data.items.length).toBe(changes.items.length);
		expect(data.items[0].uuid).toBe(changes.items[0].uuid);
	});

	test('serializes credits', () => {
		expect(data.credits.length).toBe(changes.credits.length);
		expect(data.credits[0].uuid).toBe(changes.credits[0].uuid);
	});

	test('serializes transactions', () => {
		expect(data.transactions.length).toBe(changes.transactions.length);
		expect(data.transactions[0].uuid).toBe(changes.transactions[0].uuid);
	});

	test('serializes roomSelections', () => {
		expect(data.roomSelections.length).toBe(changes.roomSelections.length);
		expect(data.roomSelections[0].uuid).toBe(changes.roomSelections[0].uuid);
	});
});

describe('deserializing', () => {
	let newOrder;
	const data = {
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
