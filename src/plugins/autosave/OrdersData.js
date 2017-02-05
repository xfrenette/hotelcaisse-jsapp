// TODO
import Plugin from '../Plugin';

/**
 * Autosave plugin that saves an Order, a Transaction, a Deposit,
 * or an Item everytime one is created.
 */
class NewOrdersData extends Plugin {
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
		observe(this.application.BusinessData.state || .token, this.saveOrdersData.bind(this))
		 */
	}

	/**
	 * Saves the data in storage. Returns a Promise that
	 * resolves when saved.
	 *
	 * @param {mixed} data Object to save
	 * @return {Promise}
	 */
	saveOrdersData(data) {
		// return this.storage.write(this.application.businessData)
	}
}

export default NewOrdersData;
