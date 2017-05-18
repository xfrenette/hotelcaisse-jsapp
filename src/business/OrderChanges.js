import { setDefaultModelSchema, getDefaultModelSchema } from 'serializr';
import Order from './Order';

/**
 * Class that represents changes to an Order. See Order class for details.
 */
class OrderChanges {
	note = null;
	customer = null;
	items = [];
	credits = [];
	transactions = [];
	roomSelections = [];
}

// OrderChanges uses the same serializing schema as Order
setDefaultModelSchema(OrderChanges, {
	factory: () => new OrderChanges(),
	extends: getDefaultModelSchema(Order),
	props: {},
});

export default OrderChanges;
