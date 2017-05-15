import { serializable, identifier } from 'serializr';

/**
 * Represents a physical room.
 */
class Room {
	@serializable(identifier())
	uuid = null;
	@serializable
	name = null;
}

export default Room;
