import { getDefaultModelSchema } from 'serializr';
import OrderChanges from 'business/OrderChanges';
import Order from 'business/Order';

describe('serializing', () => {
	test('model schema extends Order\'s', () => {
		const modelSchema = getDefaultModelSchema(OrderChanges);
		expect(modelSchema.extends).toBe(getDefaultModelSchema(Order));
	});
});
