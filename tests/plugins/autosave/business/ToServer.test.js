import ToServer from 'plugins/autosave/business/ToServer';
import Application from 'Application';
import Business from 'business/Business';
import Order from 'business/Order';

let toServer;
let application;
let business;
let testServer;

beforeEach(() => {
	testServer = {};
	toServer = new ToServer(testServer);
	application = new Application();
	business = new Business();
	application.business = business;
	toServer.bootstrap(application);
	toServer.start();
});

test('new Order', () => {
	testServer.orderCreated = jest.fn();
	const order = new Order();
	business.orderCreated(order);
	expect(testServer.orderCreated).toHaveBeenCalledWith(order);
});

test('order change', () => {
	testServer.orderChanged = jest.fn();
	const changes = { a: 'b' };
	const order = new Order();
	business.orderChanged(order, changes);
	expect(testServer.orderChanged).toHaveBeenCalledWith(order, changes);
});
