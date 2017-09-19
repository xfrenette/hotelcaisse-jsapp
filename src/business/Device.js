import { serializable, object } from 'serializr';
import EventEmiter from 'events';
import Register from './Register';

/**
 * Represents all the device specific data
 */
class Device extends EventEmiter {
	/**
	 * Register currently used by the device. Note that once the instance is created in the
	 * constructor, the same instance will always be used, but it can be updated with new data.
	 *
	 * @type {Register}
	 */
	@serializable(object(Register))
	currentRegister = null;

	constructor() {
		super();
		this.currentRegister = new Register();
	}

	/**
	 * Updates the data of this instance. Also updates the currentRegister, if present. Emits an
	 * 'update' event.
	 *
	 * @param newDevice
	 */
	update(newDevice) {
		const newRegister = newDevice.currentRegister || new Register();
		this.currentRegister.update(newRegister);
		this.emit('update');
	}
}

export default Device;
