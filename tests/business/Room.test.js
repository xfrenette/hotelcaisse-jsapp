import { serialize, deserialize } from 'serializr';
import Room from 'business/Room';

let room;

beforeEach(() => {
	room = new Room();
	room.id = 4963;
	room.name = 'test-name';
	room.archived = true;
});

describe('clone()', () => {
	let clone;

	beforeEach(() => {
		clone = room.clone();
	});

	test('same primitive attributes', () => {
		const attrs = ['name', 'id', 'archived'];
		attrs.forEach((attr) => {
			expect(clone[attr]).toEqual(room[attr]);
		});
	});
});

describe('serializing', () => {
	let data;

	beforeEach(() => {
		data = serialize(room);
	});

	test('saves primitives', () => {
		expect(data).toEqual({
			name: room.name,
			archived: room.archived,
			id: room.id,
		});
	});
});

describe('deserializing', () => {
	const jsonObject = {
		id: 'test-id',
		name: 'test-name',
		archived: true,
	};

	beforeEach(() => {
		room = deserialize(Room, jsonObject);
	});

	test('restores primitives', () => {
		expect(room.name).toBe(jsonObject.name);
		expect(room.id).toBe(jsonObject.id);
		expect(room.archived).toBe(jsonObject.archived);
	});
});
