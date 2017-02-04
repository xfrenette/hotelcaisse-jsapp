import Plugin from '../Plugin';

/**
 * Autosave plugin that saves when Register data are created,
 * modified or deleted.
 */
class Register extends Plugin {
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
}

export default Register;
