import { deserialize } from 'serializr';
import BusinessModel from '../../business/Business';
import Plugin from '../Plugin';

/**
 * Plugin that receives a list of Readers that may contain a serialized Business instance. When the
 * plugin starts, tries, in serie, the readers. At the first one that returns a serialized Business
 * instance, the plugin stops (doesn't call the following readers) and sets the business attribute
 * of the application.
 */
class Business extends Plugin {
	/**
	 * List of Readers
	 *
	 * @type {Array}
	 */
	readers = [];
	id = 'autoload-business';

	/**
	 * @param {Array} List of readers
	 */
	constructor(readers = []) {
		super();
		this.readers = readers;
	}

	/**
	 * Start the sequential reading of the Readers. When all finished, if a Business was found,
	 * updates the business property of this.application (passed in bootstrap()). Returns a Promise
	 * that resolves when everything is finished.
	 *
	 * Note : will update the business, instead or replacing it, because the Business instance in
	 * application is unique and we may have references to it in different places.
	 *
	 * @return {Promise}
	 */
	start() {
		return this.startReaders()
			.then((loadedBusiness) => {
				if (loadedBusiness !== null) {
					if (this.application.business) {
						this.application.business.update(loadedBusiness);
					} else {
						this.application.business = loadedBusiness;
					}
				}
			});
	}

	/**
	 * Starts the sequential process of reading. Every reader will try to read its data. If a data is
	 * returned and it can be deserialized as a Business, it will be returned (the process will end).
	 * Else, the next reader will try. At the end, if no reader found a Business, null is returned.
	 * Returns a Promise that resolves with the result (the first Business found, or null).
	 *
	 * @return {Promise}
	 */
	startReaders() {
		let promise = Promise.resolve(null);

		/**
		 * We construct something similar to this :
		 *
		 * Promise.resolve(null)
		 * .then((prevData) => {
		 * 	// <ReaderBlock(1)>
		 * })
		 * .then((prevData) => {
		 * 	// <ReaderBlock(2)>
		 * })
		 * .then((prevData) => {
		 * 	// <ReaderBlock(3)>
		 * })
		 * ...
		 *
		 * Where ReaderBlock(n) :
		 * 	if prevData is not null, return it
		 * 	else, try this.readers[n].read()
		 * 		if a Business object is returned, return it
		 * 		else return null
		 *
		 * The returned value is sent to the following Promise
		 */
		this.readers.forEach((reader) => {
			promise = promise.then((prevData) => {
				if (prevData !== null) {
					return prevData;
				}

				return reader.read()
					.then(data => this.deserializeBusiness(data))
					.catch(() => null);
			});
		});

		return promise;
	}

	/**
	 * Tries to deserialize an object in a Business instance, then returns it. If it cannot
	 * deserialize it, returns null. Note that many object can be "deserialized" as a Business, it
	 * would be an empty Business instance, so be careful.
	 *
	 * @param {Object} data
	 * @return {Business|null}
	 */
	deserializeBusiness(data) {
		try {
			return deserialize(BusinessModel, data);
		} catch(e) {
			this.log.warn(`Could not deserialize Business: ${e.toString()}`);
			return null;
		}
	}
}

export default Business;
