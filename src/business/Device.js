import { serializable, object } from 'serializr';
import EventEmiter from 'events';
import Register from './Register';

/**
 * Represents all the device specific data
 */
class Device extends EventEmiter {
	/**
	 * Number to use for the next Register we open
	 *
	 * @type {Number}
	 */
	@serializable
	nextRegisterNumber = null;
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
	 * Updates the data of this instance. If `deviceData` is an object, only updates the defined
	 * attributes. If it is a Device instance, updates all attributes. Emits an 'update' event.
	 * Throws an error if the `deviceData` is an object that cannot be deserialized.
	 *
	 * @param {object|Device} deviceData
	 */
	update(deviceData) {
		const attrs = ['nextRegisterNumber'];

		attrs.forEach((attr) => {
			if (deviceData[attr] !== undefined) {
				this[attr] = deviceData[attr];
			}
		});

		// Following is Register related
		let newRegister = deviceData.currentRegister;

		if (newRegister === null) {
			newRegister = new Register();
		}

		if (newRegister !== undefined) {
			this.currentRegister.update(newRegister);
		}

		this.emit('update');
	}
}

export default Device;
