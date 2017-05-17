import { serialize, deserialize } from 'serializr';
import RoomSelection from 'business/RoomSelection';
import Room from 'business/Room';

let roomSelection;
let room;

beforeEach(() => {
	roomSelection = new RoomSelection();
	roomSelection.uuid = 'test-uuid';
	roomSelection.startDate = new Date(1494883301000);
	roomSelection.endDate = new Date(1495142500000);

	room = new Room();
	room.uuid = 'test-room-uuid';
	roomSelection.room = room;
});

describe('serializing', () => {
	let data;
	const fields = {
		a: 'b',
		c: true,
		d: 2,
	};

	beforeEach(() => {
		roomSelection.fields = fields;
		data = serialize(roomSelection);
	});

	test('saves primitives', () => {
		expect(data).toEqual(expect.objectContaining({
			uuid: roomSelection.uuid,
			startDate: expect.any(Number),
			endDate: expect.any(Number),
		}));
	});

	test('saves room', () => {
		expect(data.room).toBe(room.uuid);
	});

	test('saves fields', () => {
		expect(data.fields).toEqual(fields);
	});
});

describe('deserializing', () => {
	const jsonObject = {
		uuid: 'test-uuid',
		startDate: 1494883301000,
		endDate: 1495142500000,
		fields: { a: 'b' },
	};

	beforeEach(() => {
		roomSelection = deserialize(RoomSelection, jsonObject);
	});

	test('restores primitives', () => {
		expect(roomSelection.uuid).toBe(jsonObject.uuid);
		expect(roomSelection.fields).toEqual(jsonObject.fields);
	});

	test('restores dates', () => {
		expect(roomSelection.startDate).toBeInstanceOf(Date);
		expect(roomSelection.endDate).toBeInstanceOf(Date);
	});
});
