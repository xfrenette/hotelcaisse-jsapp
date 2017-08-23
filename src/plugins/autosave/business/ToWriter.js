import Plugin from '../../Plugin';

/**
 * Plugin that listens to any change to the Business instance (and its Register) and writes the
 * *whole* Business instance to a writer; that is for each modification, writes the whole Business
 * instance.
 */
class ToWriter extends Plugin {
	id = 'autosave.business.toWriter';
	/**
	 * Writer where to write the Business instance
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
	 * Listen to Business events. For each of them, we simply write the whole Business instance to the
	 * writer.
	 */
	registerListeners() {
		const business = this.application.business;
		const callback = () => { this.writeBusiness(); };

		business.on('newOrder', callback);
		business.on('orderChange', callback);
	}

	/**
	 * Writes the whole Business instance to the Writer
	 */
	writeBusiness() {
		this.writer.write(this.application.business);
	}
}

export default ToWriter;
