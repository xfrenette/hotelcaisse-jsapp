import Plugin from '../../Plugin';

/**
 * Plugin that listens to any change to the Device instance and writes the *whole* Device
 * instance to a writer; that is for each modification, writes the whole Device instance.
 */
class ToWriter extends Plugin {
	id = 'autosave.device.toWriter';
	/**
	 * Writer where to write the Device instance
	 *
	 * @type {Writer}
	 */
	writer = null;

	constructor(writer) {
		super();
		this.writer = writer;
	}

	/**
	 * When starting, start listening to events
	 */
	start() {
		this.registerListeners();
	}

	/**
	 * Listen to Device events. For each of them, we simply write the whole Device instance to
	 * the writer.
	 */
	registerListeners() {
		const register = this.application.register;
		const device = this.application.device;
		const callback = () => { this.writeDevice(); };

		register.on('open', callback);
		register.on('close', callback);
		register.on('cashMovementAdd', callback);
		register.on('cashMovementRemove', callback);

		device.on('update', callback);
	}

	/**
	 * Writes the whole Device instance to the Writer
	 */
	writeDevice() {
		this.writer.write(this.application.device);
	}
}

export default ToWriter;
