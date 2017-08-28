import Plugin from '../../Plugin';

/**
 * Plugin that listens to any change to the Register instance and writes the *whole* Register
 * instance to a writer; that is for each modification, writes the whole Register instance.
 */
class ToWriter extends Plugin {
	id = 'autosave.register.toWriter';
	/**
	 * Writer where to write the Register instance
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
	 * Listen to Register events. For each of them, we simply write the whole Register instance to
	 * the writer.
	 */
	registerListeners() {
		const register = this.application.register;
		const callback = () => { this.writeRegister(); };

		register.on('open', callback);
		register.on('close', callback);
		register.on('update', callback);
		register.on('cashMovementAdd', callback);
		register.on('cashMovementRemove', callback);
	}

	/**
	 * Writes the whole Register instance to the Writer
	 */
	writeRegister() {
		this.writer.write(this.application.register);
	}
}

export default ToWriter;
