import { serialize } from 'serializr';
import OrderUpdates from 'plugins/autosave/OrderUpdates';
import Order from 'business/Order';
import OrderChanges from 'business/OrderChanges';
import Business from 'business/Business';
import DataChange from 'DataChange';
import DATA_CHANGE_TYPES from 'const/data-change-types';
import TestWriter from '../../io/writers/TestWriter';

let orderUpdates;
let order;
let business;
let testWriter;

beforeEach(() => {
	business = new Business();
	order = new Order();
	testWriter = new TestWriter();
	orderUpdates = new OrderUpdates(testWriter);
});

describe('constructor()', () => {
	test('saves writer', () => {
		orderUpdates = new OrderUpdates(testWriter);
		expect(orderUpdates.writer).toBe(testWriter);
	});
});

describe('orderAdded()', () => {
	test('called when Order added to Business', () => {
		orderUpdates.orderAdded = jest.fn();
		orderUpdates.start();
		business.addOrder(order);
		expect(orderUpdates.orderAdded).toHaveBeenCalledWith(order);
	});

	test('writer called', (done) => {
		testWriter.on('write', () => {
			done();
		});
		orderUpdates.orderAdded(order);
	});

	test('writer called with expected DataChange', (done) => {
		const expected = serialize(new DataChange(
			DATA_CHANGE_TYPES.business.order.added,
			serialize(order)
		));
		testWriter.on('write', (data) => {
			expect(data).toEqual(expected);
			done();
		});
		orderUpdates.orderAdded(order);
	});
});

describe('orderModified()', () => {
	beforeEach(() => {
		order.recordChanges();
		order.note = `${order.note} (modif)`;
	});

	test('called when Order modified', () => {
		orderUpdates.orderModified = jest.fn();
		orderUpdates.start();
		order.commitChanges();
		expect(orderUpdates.orderModified).toHaveBeenCalledWith(order, expect.any(OrderChanges));
	});

	test('writer called', (done) => {
		testWriter.on('write', () => {
			done();
		});
		orderUpdates.orderModified(order, new OrderChanges());
	});

	test('writer called with expected DataChange', (done) => {
		const changes = new OrderChanges();
		changes.note = 'new-note';
		const expected = serialize(new DataChange(
			DATA_CHANGE_TYPES.order.modified,
			{
				changes: serialize(changes),
				orderUUID: order.uuid,
			}
		));
		testWriter.on('write', (data) => {
			expect(data).toEqual(expected);
			done();
		});
		orderUpdates.orderModified(order, changes);
	});
});
