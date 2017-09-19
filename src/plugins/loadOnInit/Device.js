import DeviceModel from '../../business/Device';
import Plugin from '../Plugin';

/**
 * Plugin that tries to load a Device object from its reader when the plugin starts. If
 * successful, updates the `device` object in the Application instance. The start method will
 * resolve once the loading is finished, so it can be used to determine when the app loaded.
 */
class Device extends Plugin {
	id = 'loadOnInit.device';
	/**
	 * Reader where to read the Device
	 *
	 * @type {Reader}
	 */
	reader = null;

	constructor(reader) {
		super();
		this.reader = reader;
	}

	/**
	 * Reads from its reader. If a Device is returned updates the `device` property of
	 * this.application (passed in bootstrap()). Returns a Promise that resolves when everything is
	 * finished.
	 *
	 * Note : will update the device, instead or replacing it, because the Device instance in
	 * application is unique and we may have references to it in different places.
	 *
	 * @return {Promise}
	 */
	start() {
		return this.reader.read()
			.then((data) => {
				this.updateDevice(data);
			});
	}

	/**
	 * Updates the Device of the Application instance with the `newDevice` only if it is a valid
	 * Device (DeviceModel) instance.
	 *
	 * @param {DeviceModel} newDevice
	 */
	updateDevice(newDevice) {
		if (newDevice instanceof DeviceModel) {
			this.application.device.update(newDevice);
		}
	}
}

export default Device;
