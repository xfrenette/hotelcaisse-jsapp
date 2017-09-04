import ToWriter from 'plugins/autosave/business/ToWriter';
import Application from 'Application';
import Business from 'business/Business';
import Order from 'business/Order';

let toWriter;
let writer;
let application;
let business;

beforeEach(() => {
	writer = {
		write: jest.fn(),
	};
	toWriter = new ToWriter(writer);
	application = new Application();
	business = new Business();
	application.business = business;
	toWriter.bootstrap(application);
	toWriter.start();
});

test('new Order', () => {
	const order = new Order();
	business.orderCreated(order);
	expect(writer.write).toHaveBeenCalledWith(business);
});

test('order update', () => {
	business.update(new Business());
	expect(writer.write).toHaveBeenCalledWith(business);
});

test('order change', () => {
	const changes = { a: 'b' };
	const order = new Order();
	business.orderChanged(order, changes);
	expect(writer.write).toHaveBeenCalledWith(business);
});
