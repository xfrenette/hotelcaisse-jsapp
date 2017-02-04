import Plugin from '../Plugin';

/**
 * Autosave plugin that saves the BusinessData data in storage everytime
 * any BusinessData is modified.
 */
class BusinessData extends Plugin {
	storage = null;

	/**
	 * @param {DataSource} storage
	 */
	constructor(storage) {
		//this.storage = storage;
	}

	start() {
		// this.registerObservers()
	}

	/**
	 * Registers different observers on BusinessData
	 */
	registerObservers() {
		/*
		observe(this.application.BusinessData.state || .token, this.saveBusinessData.bind(this))
		 */
	}

	/**
	 * Saves the BusinessData data in storage. Returns a Promise that
	 * resolves when saved.
	 *
	 * @return {Promise}
	 */
	saveBusinessData() {
		// return this.storage.write(this.application.businessData)
	}
}

export default BusinessData;
