import Writer from './Writer';

/**
 * The Stubborn writer receives another writer (it is a kind of wrapper). When write() is called,
 * it will call write() on its own writer (it sends an array, see below). If the write fails, it
 * retries again later, and will continue trying until it works.
 *
 * When the Stubborn write() method is called, the data is added to an internal queue (FIFO). It is
 * this queue (an array of objects) that is sent to the writer. So it is not one object at a time
 * that is sent to the writer, but the whole queue as an array of objects, this allows better
 * performances. When the write succeeds, all objects that were successfully sent are removed from
 * the queue. The Stubborn writer will then restart the process until the queue is empty.
 */
class Stubborn extends Writer {
	/**
	 * Queue of objects that awaits to be written.
	 *
	 * @type {Array}
	 */
	queue = [];
	/**
	 * If the writer is currently trying to write or is schedule to retry, this variable holds the
	 * associated Promise. Else it is null.
	 *
	 * @type {Promise|null}
	 */
	currentTry = null;

	/**
	 * @param {Writer} writer
	 */
	constructor(writer) {
		super();
		this.writer = writer;
	}

	/**
	 * Adds data to the queue and calls dataAddedToQueue(). Returns a Promise that resolves when the
	 * whole queue was written without error. It means that if the writer is waiting for a retry, the
	 * Promise will resolve when the retry finishes successfully.
	 *
	 * @param {mixed} data
	 * @return {Promise}
	 */
	write(data) {
		this.addToQueue(data);
		return this.dataAddedToQueue();
	}

	/**
	 * Adds an object to the queue.
	 *
	 * @param {mixed} data
	 */
	addToQueue(data) {
		this.queue.push(data);
	}

	/**
	 * Removes a list of objects from the queue.
	 *
	 * @param {Array} datas
	 */
	removeFromQueue(datas) {
		this.queue = this.queue.filter(
			data => datas.indexOf(data) === -1
		);
	}

	/**
	 * Function called when new data was added to the queue. If no writing is executing and no retry
	 * scheduled, tries to write data and returns the Promise. Else, returns the current Promise of
	 * the writing or retry.
	 *
	 * @return {Promise}
	 */
	dataAddedToQueue() {
		if (!this.currentTry) {
			this.currentTry = this.tryWrite().then(() => {
				this.currentTry = null;
			});
		}

		return this.currentTry;
	}

	/**
	 * Calls the write() method on the internal writer. If it succeeds and there are new data in the
	 * queue, it restarts a try. If it fails, it schedules a retry. Returns a Promise that resolves
	 * once the whole queue is written without error.
	 *
	 * @return {Promise}
	 */
	tryWrite() {
		const currentQueue = this.getCurrentQueue();

		if (currentQueue.length === 0) {
			return Promise.resolve();
		}

		const writing = this.writer.write(currentQueue);

		return writing.then(
			// If successful, go for another round of tryWrite (and return its Promise) for data that
			// could have been added since
			() => {
				this.removeFromQueue(currentQueue);
				return this.tryWrite();
			},
			// If fail, call tryLater (and return its promise)
			() => this.retryLater(this.getNextTimeout())
		);
	}

	/**
	 * Returns the next delay before a retry. In milliseconds.
	 *
	 * @return {Number}
	 */
	getNextTimeout() {
		return 60 * 1000;
	}

	/**
	 * Schedules a retry that will call tryWrite() after delay milliseconds. Returns a Promise that
	 * resolves with the tryWrite
	 *
	 * @param {Number} delay
	 * @return {Promise}
	 */
	retryLater(delay) {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve(this.tryWrite());
			}, delay);
		});
	}

	/**
	 * Returns a copy of the queue as it is now.
	 *
	 * @return {Array}
	 */
	getCurrentQueue() {
		return [...this.queue];
	}
}

export default Stubborn;
