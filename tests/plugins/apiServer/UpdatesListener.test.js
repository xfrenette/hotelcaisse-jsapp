import { serialize } from 'serializr';
import Listener from 'plugins/apiServer/UpdatesListener';
import Application from 'Application';
import Business from 'business/Business';
import Register from 'business/Register';
import Device from 'business/Device';
import Room from 'business/Room';
import Server from 'servers/Api';

let listener;
let application;
let server;

beforeEach(() => {
	server = new Server();

	application = new Application();
	application.business = new Business();
	application.device = new Device();

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

test('device update', (done) => {
	const newDevice = new Device();
	const newRegister = new Register();
	newRegister.uuid = 'test-register-uuid';
	newDevice.currentRegister = newRegister;

	application.device.update = (updateData) => {
		expect(updateData).toEqual(newDevice);
		done();
	};
	server.processResponseDevice({ device: serialize(newDevice) });
});
