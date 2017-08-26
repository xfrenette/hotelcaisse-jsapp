import { list, object, primitive, serializable } from 'serializr';
import Customer from './Customer';
import Item from './Item';
import Credit from './Credit';
import Transaction from './Transaction';
import RoomSelection from './RoomSelection';

/**
 * Class that represents changes to an Order. See Order class for details. Use `setField` to
 * fill this object, else `changedFields` will not be updated.
 */
class OrderChanges {
	@serializable
	note = null;
	@serializable(object(Customer))
	customer = null;
	@serializable(list(object(Item)))
	items = [];
	@serializable(list(object(Credit)))
	credits = [];
	@serializable(list(object(Transaction)))
	transactions = [];
	@serializable(list(object(RoomSelection)))
	roomSelections = [];
	@serializable(list(primitive()))
	changedFields = [];

	/**
	 * Records the changed value of a field.
	 *
	 * @param {string} field
	 * @param {*} value
	 */
	setField(field, value) {
		this[field] = value;
		if (!this.fieldChanged(field)) {
			this.changedFields.push(field);
		}
	}

	/**
	 * Returns true if the `field` has changed.
	 *
	 * @param {string} field
	 * @return {boolean}
	 */
	fieldChanged(field) {
		return this.changedFields.indexOf(field) >= 0;
	}

	/**
	 * Returns true if this instance contains any changes.
	 *
	 * @return {boolean}
	 */
	hasChanges() {
		return this.changedFields.length > 0;
	}
}

export default OrderChanges;
