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
	changes.note = 'test-note';
	changes.customer = new Customer();
	changes.customer.setFieldValue({ id: 1123, value: 'test1' });
	changes.items.push(new Item('test-item'));
	changes.credits.push(new Credit('test-credit'));
	changes.transactions.push(new Transaction('test-transaction'));
	changes.roomSelections.push(new RoomSelection('test-room-selection'));
});

describe('serializing', () => {
	let data;

	beforeEach(() => {
		data = serialize(changes);
	});

	test('serializes primitives', () => {
		expect(data.note).toBe(changes.note);
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
