import { serializable, identifier } from 'serializr';

/**
 * Represents a physical room.
 */
class Room {
	@serializable(identifier())
	id = null;
	@serializable
	name = null;

	/**
	 * Returns a clone of this Room (a new object)
	 *
	 * @return {Room}
	 */
	clone() {
		return Object.assign(Object.create(this), this);
	}
}

export default Room;
