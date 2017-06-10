import { serializable, identifier, date, reference, map } from 'serializr';
import { observable } from 'mobx';
import isEqual from 'lodash.isequal';
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
	@observable
	room = null;
	/**
	 * The date the selection starts (inclusive)
	 *
	 * @type {Date}
	 */
	@serializable(date())
	@observable
	startDate = null;
	/**
	 * The date the selection ends (exclusive)
	 *
	 * @type {Date}
	 */
	@serializable(date())
	@observable
	endDate = null;
	/**
	 * Values for each of the fields. Key is field uuid and the value is a primitive.
	 *
	 * @type {Map}
	 */
	@serializable(map())
	@observable
	fieldValues = new Map();
	/**
	 * References to Field object for which we store values in fieldValues. Setting this attribute
	 * is optionnal, but required if we want to use validate(). This attribute is not serialized.
	 *
	 * @type {Array<Field>}
	 */
	fields = [];

	constructor(uuid = null) {
		this.uuid = uuid;
	}

	/**
	 * Returns the value saved for the specified Field. Returns null if no value is found.
	 *
	 * @param {Field} field
	 * @return {mixed}
	 */
	getFieldValue(field) {
		if (this.fieldValues.has(field.uuid)) {
			return this.fieldValues.get(field.uuid);
		}

		return null;
	}

	/**
	 * Sets the value for the field. The value must be a primitive.
	 *
	 * @param {Field} field
	 * @param {mixed} value
	 */
	setFieldValue(field, value) {
		this.fieldValues.set(field.uuid, value);
	}

	/**
	 * Creates a copy of this RoomSelection. The fields are shallow copied (but if they are only 1
	 * level primitives, there won't be any problem).
	 *
	 * @return {RoomSelection}
	 */
	clone() {
		const clone = new RoomSelection();
		clone.uuid = this.uuid;
		clone.room = this.room;
		['startDate', 'endDate'].forEach((attr) => {
			if (this[attr] instanceof Date) {
				clone[attr] = new Date(this[attr].getTime());
			}
		})
		clone.fieldValues.replace(this.fieldValues);

		return clone;
	}

	/**
	 * Compares with another RoomSelection and returns true if they are equal.
	 *
	 * @param {RoomSelection} other
	 * @return {Boolean}
	 */
	isEqualTo(other) {
		let otherIsEqual = true;
		const attributes = ['uuid', 'startDate', 'endDate', 'room'];

		attributes.find((attribute) => {
			if (!isEqual(other[attribute], this[attribute])) {
				otherIsEqual = false;
				return true;
			}

			return false;
		});

		if (!isEqual(this.fieldValues.toJS(), other.fieldValues.toJS())) {
			otherIsEqual = false;
		}

		return otherIsEqual;
	}

	/**
	 * Replaces the room property with a copy of it. This way, this RoomSelection will keep the
	 * reference to the Room as it was, even if the room is later modified or removed.
	 */
	freezeRoom() {
		this.room = this.room.clone();
	}

	/**
	 * Validate itself by validating it has a room and that all its fields are valid. Returns
	 * undefined if valid, else returns an object where the key is the attribute or field (UUID) in
	 * error and its value an array of errors. Note the fields attribute must be set with the Fields
	 * for the validation of fields to work.
	 *
	 * @return {undefined|Object}
	 */
	validate() {
		const res = {};
		let valid = true;

		// Validate the room
		if (!this.room) {
			res.room = ['A room must be set'];
			valid = false;
		}

		// Validate the fields
		this.fields.forEach((field) => {
			const fieldValidation = field.validate(this.getFieldValue(field));
			if (fieldValidation) {
				res[field.uuid] = fieldValidation;
				valid = false;
			}
		});

		return valid ? undefined : res;
	}
}

export default RoomSelection;
