import { serialize, deserialize } from 'serializr';
import Room from 'business/Room';

let room;

beforeEach(() => {
	room = new Room();
	room.uuid = 'test-uuid';
	room.name = 'test-name';
});

describe('serializing', () => {
	let data;

	beforeEach(() => {
		data = serialize(room);
	});

	test('saves primitives', () => {
		expect(data).toEqual({
			name: room.name,
			uuid: room.uuid,
		});
	});
});

describe('deserializing', () => {
	const jsonObject = {
		uuid: 'test-uuid',
		name: 'test-name',
	};

	beforeEach(() => {
		room = deserialize(Room, jsonObject);
	});

	test('restores primitives', () => {
		expect(room.name).toBe(jsonObject.name);
		expect(room.uuid).toBe(jsonObject.uuid);
	});
});
