import { serializable, identifier, date, reference } from 'serializr';
import { rawObject } from '../vendor/serializr/propSchemas';
import Room from './Room';

/**
 * Represents a room selected for some (consecutive) dates (between startDate, inclusive, and
 * endDate, exclusive). Can contain a list of custom fields.
 */
class RoomSelection {
	/**
	 * Unique id of this selection
	 *
	 * @type {String}
	 */
	@serializable(identifier())
	uuid = null;
	/**
	 * The selected Room
	 *
	 * @type {Room}
	 */
	@serializable(reference(Room))
	room = null;
	/**
	 * The date the selection starts (inclusive)
	 *
	 * @type {Date}
	 */
	@serializable(date())
	startDate = null;
	/**
	 * The date the selection ends (exclusive)
	 *
	 * @type {Date}
	 */
	@serializable(date())
	endDate = null;
	/**
	 * Fields values
	 *
	 * @type {Object}
	 */
	@serializable(rawObject())
	fields = {};
}

export default RoomSelection;
