import { list, object, serializable } from 'serializr';
import Customer from './Customer';
import Item from './Item';
import Credit from './Credit';
import Transaction from './Transaction';
import RoomSelection from './RoomSelection';

/**
 * Class that represents changes to an Order. See Order class for details.
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
}

export default OrderChanges;
