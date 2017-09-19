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
	const serializedBusiness = serialize(newBusiness);

	application.business.update = (updateData) => {
		expect(updateData).toEqual(serializedBusiness);
		done();
	};
	server.processResponseBusiness({ business: serializedBusiness });
});

test('device update', (done) => {
	const newDevice = new Device();
	const newRegister = new Register();
	newRegister.uuid = 'test-register-uuid';
	newDevice.currentRegister = newRegister;
	const serializedDevice = serialize(newDevice);

	application.device.update = (updateData) => {
		expect(updateData).toEqual(serializedDevice);
		done();
	};
	server.processResponseDevice({ device: serializedDevice });
});
