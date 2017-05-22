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
	roomSelection.fields = { a: 'b' };

	room = new Room();
	room.uuid = 'test-room-uuid';
	roomSelection.room = room;
});

describe('clone()', () => {
	let clone;

	beforeEach(() => {
		clone = roomSelection.clone();
	});

	test('is different object', () => {
		expect(clone).not.toBe(roomSelection);
	});

	test('is RoomSelection', () => {
		expect(clone).toBeInstanceOf(RoomSelection);
	});

	test('has same primitives', () => {
		expect(clone.uuid).toBe(roomSelection.uuid);
		expect(clone.room).toBe(roomSelection.room);
		expect(clone.startDate.getTime()).toBe(roomSelection.startDate.getTime());
		expect(clone.endDate.getTime()).toBe(roomSelection.endDate.getTime());
	});

	test('copies fields', () => {
		expect(clone.fields).toEqual(roomSelection.fields);
		expect(clone.fields).not.toBe(roomSelection.fields);
	});
});

describe('isEqualTo()', () => {
	let copy;

	beforeEach(() => {
		copy = roomSelection.clone();
	});

	test('returns false if different uuid', () => {
		copy.uuid = `${roomSelection.uuid}-copy`;
		expect(roomSelection.isEqualTo(copy)).toBe(false);
	});

	test('returns false if different startDate', () => {
		copy.startDate = new Date(roomSelection.startDate.getTime() + 1);
		expect(roomSelection.isEqualTo(copy)).toBe(false);
	});

	test('returns false if different endDate', () => {
		copy.endDate = new Date(roomSelection.endDate.getTime() + 1);
		expect(roomSelection.isEqualTo(copy)).toBe(false);
	});

	test('returns false if different room', () => {
		const newRoom = new Room();
		newRoom.uuid = `${room.uuid}-copy`;
		copy.room = newRoom;
		expect(roomSelection.isEqualTo(copy)).toBe(false);
	});

	test('returns true if different room with same uuid', () => {
		const newRoom = new Room();
		newRoom.uuid = room.uuid;
		copy.room = newRoom;
		expect(roomSelection.isEqualTo(copy)).toBe(true);
	});

	test('works with default null values', () => {
		roomSelection = new RoomSelection();
		copy = roomSelection.clone();
		expect(roomSelection.isEqualTo(copy)).toBe(true);
	});
});

describe('freezeRoom()', () => {
	beforeEach(() => {
		roomSelection.freezeRoom();
	});

	test('room is still Room instance', () => {
		expect(roomSelection.room).toBeInstanceOf(Room);
	});

	test('is not same object', () => {
		expect(roomSelection.room).not.toBe(room);
	});

	test('has same values', () => {
		expect(roomSelection.room.uuid).toBe(room.uuid);
		expect(roomSelection.room.name).toBe(room.name);
	});
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
