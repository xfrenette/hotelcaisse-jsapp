import { serializable, identifier } from 'serializr';

/**
 * Represents a physical room.
 */
class Room {
	/**
	 * Id of the Room
	 * @type {Integer}
	 */
	@serializable(identifier())
	id = null;
	/**
	 * Name
	 * @type {String}
	 */
	@serializable
	name = null;
	/**
	 * @type {boolean}
	 */
	@serializable
	archived = false;

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
