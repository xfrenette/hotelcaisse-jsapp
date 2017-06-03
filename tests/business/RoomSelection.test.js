import { serialize, deserialize } from 'serializr';
import { isObservable } from 'mobx';
import RoomSelection from 'business/RoomSelection';
import Room from 'business/Room';
import { TextField } from 'fields';

let roomSelection;
let room;
let field;

beforeEach(() => {
	field = new TextField();
	field.uuid = 'field-uuid';

	roomSelection = new RoomSelection();
	roomSelection.uuid = 'test-uuid';
	roomSelection.startDate = new Date(1494883301000);
	roomSelection.endDate = new Date(1495142500000);
	roomSelection.fieldValues.set(field.uuid, 'two');
	roomSelection.fieldValues.set('three', 4);

	room = new Room();
	room.uuid = 'test-room-uuid';
	roomSelection.room = room;
});

describe('construct', () => {
	test('sets uuid', () => {
		const uuid = 'test-uuid';
		roomSelection = new RoomSelection(uuid);
		expect(roomSelection.uuid).toBe(uuid);
	});
});

describe('fieldValues', () => {
	test('is observable', () => {
		expect(isObservable(roomSelection, 'fieldValues')).toBe(true);
	});
});

describe('getFieldValue()', () => {
	test('returns null if field is unknown', () => {
		const newField = new TextField();
		newField.uuid = 'test-new-field';
		expect(roomSelection.getFieldValue(newField)).toBeNull();
	});

	test('returns value if field exists', () => {
		roomSelection.fieldValues.set(field.uuid, false);
		expect(roomSelection.getFieldValue(field)).toBe(false);
	});
});

describe('setFieldValue()', () => {
	test('sets the field value', () => {
		const value = 'test-value';
		roomSelection.setFieldValue(field, value);
		expect(roomSelection.getFieldValue(field)).toBe(value);
	});
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

	test('copies fieldValues', () => {
		expect(clone.fieldValues.toJS()).toEqual(roomSelection.fieldValues.toJS());
		expect(clone.fieldValues).not.toBe(roomSelection.fieldValues);
	});

	test('dates are copies, not references', () => {
		expect(clone.startDate).not.toBe(roomSelection.startDate);
		expect(clone.endDate).not.toBe(roomSelection.endDate);
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

	test('returns false if different fieldValue', () => {
		copy.setFieldValue(field, 'two (copy)');
		expect(roomSelection.isEqualTo(copy)).toBe(false);
	});

	test('returns true if different room with same uuid', () => {
		const newRoom = new Room();
		newRoom.uuid = room.uuid;
		copy.room = newRoom;
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
	const fieldValues = {
		a: 'b',
		c: true,
		d: 2,
	};

	beforeEach(() => {
		roomSelection.fieldValues.replace(fieldValues);
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

	test('saves fieldValues', () => {
		expect(data.fieldValues).toEqual(fieldValues);
	});
});

describe('deserializing', () => {
	const jsonObject = {
		uuid: 'test-uuid',
		startDate: 1494883301000,
		endDate: 1495142500000,
		fieldValues: { a: 'b' },
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

	test('restores fieldValues', () => {
		expect(roomSelection.fieldValues.toJS()).toEqual(jsonObject.fieldValues);
	});
});
