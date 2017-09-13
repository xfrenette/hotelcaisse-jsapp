import { serialize } from 'serializr';
import Listener from 'plugins/apiServer/UpdatesListener';
import Application from 'Application';
import Business from 'business/Business';
import Register from 'business/Register';
import Room from 'business/Room';
import Server from 'servers/Api';

let listener;
let application;
let server;

beforeEach(() => {
	server = new Server();

	application = new Application();
	application.business = new Business();
	application.register = new Register();

	listener = new Listener(server);
	listener.bootstrap(application);
	listener.start();
});

test('business update', (done) => {
	const newBusiness = new Business();
	const room = new Room();
	room.name = 'test room';
	newBusiness.rooms.push(room);

	application.business.update = (updateData) => {
		expect(updateData).toEqual(newBusiness);
		done();
	};
	server.processResponseBusiness({ business: serialize(newBusiness) });
});

test('register update', (done) => {
	const newRegister = new Register();
	newRegister.uuid = 'test-register-uuid';

	application.register.update = (updateData) => {
		expect(updateData).toEqual(newRegister);
		done();
	};
	server.processResponseRegister({ deviceRegister: serialize(newRegister) });
});
