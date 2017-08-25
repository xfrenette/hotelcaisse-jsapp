import { deserialize, serialize } from 'serializr';
import { isObservable } from 'mobx';
import RoomSelection from 'business/RoomSelection';
import Room from 'business/Room';
import { TextField } from 'fields';
import {
	fieldValues as fieldValuesSerializer,
	timestamp as timestampSerializer,
} from 'vendor/serializr/propSchemas';

let roomSelection;
let room;
let field;

beforeEach(() => {
	field = new TextField();
	field.id = 7123;

	roomSelection = new RoomSelection();
	roomSelection.uuid = 'test-uuid';
	roomSelection.startDate = new Date(1494883301632);
	roomSelection.endDate = new Date(1495142500123);
	roomSelection.fieldValues.set(field.id, 'two');
	roomSelection.fieldValues.set('three', 4);

	room = new Room();
	room.id = 8965;
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

describe('room', () => {
	test('is observable', () => {
		expect(isObservable(roomSelection, 'room')).toBe(true);
	});
});

describe('startDate', () => {
	test('is observable', () => {
		expect(isObservable(roomSelection, 'startDate')).toBe(true);
	});
});

describe('endDate', () => {
	test('is observable', () => {
		expect(isObservable(roomSelection, 'endDate')).toBe(true);
	});
});

describe('getFieldValue()', () => {
	test('returns null if field is unknown', () => {
		const newField = new TextField();
		newField.id = 4567;
		expect(roomSelection.getFieldValue(newField)).toBeNull();
	});

	test('returns value if field exists', () => {
		roomSelection.fieldValues.set(field.id, false);
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
		newRoom.id = `${room.id}-copy`;
		copy.room = newRoom;
		expect(roomSelection.isEqualTo(copy)).toBe(false);
	});

	test('returns false if different fieldValue', () => {
		copy.setFieldValue(field, 'two (copy)');
		expect(roomSelection.isEqualTo(copy)).toBe(false);
	});

	test('returns true if different room with same id', () => {
		const newRoom = new Room();
		newRoom.id = room.id;
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
		expect(roomSelection.room.id).toBe(room.id);
		expect(roomSelection.room.name).toBe(room.name);
	});
});

describe('freeze', () => {
	test('calls freezeRoom', () => {
		roomSelection.freezeRoom = jest.fn();
		roomSelection.freeze();
		expect(roomSelection.freezeRoom).toHaveBeenCalled();
	});
});

describe('validate()', () => {
	beforeEach(() => {
		field.required = true;
		roomSelection.fields = [field];
	});

	test('returns undefined if otherwise valid and field is undefined', () => {
		roomSelection.fields = [];
		const res = roomSelection.validate();
		expect(res).toBeUndefined();
	});

	test('invalid if room is not set', () => {
		roomSelection.room = null;
		const res = roomSelection.validate();
		expect(res).toEqual({
			room: expect.any(Array),
		});
	});

	test('returns an object if a field is in error', () => {
		roomSelection.setFieldValue(field, '');
		const res = roomSelection.validate();
		expect(res).toEqual({
			[field.id]: expect.any(Array),
		});
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
			startDate: timestampSerializer().serializer(roomSelection.startDate),
			endDate: timestampSerializer().serializer(roomSelection.endDate),
		}));
	});

	test('saves room', () => {
		expect(data.room).toBe(room.id);
	});

	test('saves fieldValues', () => {
		const expected = fieldValuesSerializer().serializer(roomSelection.fieldValues);
		expect(data.fieldValues).toEqual(expected);
	});
});

describe('deserializing', () => {
	const date = new Date();
	date.setMilliseconds(0);

	const jsonObject = {
		uuid: 'test-uuid',
		startDate: timestampSerializer().serializer(date),
		endDate: timestampSerializer().serializer(date),
		fieldValues: [{ fieldId: 'a', value: 'b' }],
	};

	beforeEach(() => {
		roomSelection = deserialize(RoomSelection, jsonObject);
	});

	test('restores primitives', () => {
		expect(roomSelection.uuid).toBe(jsonObject.uuid);
	});

	test('restores dates', () => {
		expect(roomSelection.startDate).toEqual(date);
		expect(roomSelection.endDate).toEqual(date);
	});

	test('restores fieldValues', () => {
		expect(Array.from(roomSelection.fieldValues.keys())).toEqual(['a']);
		expect(Array.from(roomSelection.fieldValues.values())).toEqual(['b']);
	});
});
