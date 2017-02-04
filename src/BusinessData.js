/**
 * This Class contains all the business specific data required
 * for this device : the device's register, products, categories,
 * accepted payment modes, etc.
 */
class BusinessData {
	state = STATES.NEW;
	deviceRegister = null;
	products = [];
	productCategories = [];
	paymentModes = [];
	orders = [];

	/**
	 * Tries to initialize from data in a list of sources. Will
	 * try to load the data from each source in order. If a source
	 * returns valid data, it saves it and stops there, else it
	 * continues to the next. At the end (even if no sources contained
	 * valid data), sets the state to INITIALIZED. Returns a Promise
	 * that resolves when initializing finishes
	 *
	 * @param {Array<DataSource>} sources
	 * @return {Promise}
	 */
	initFromSources(sources) {
		/*
		return new Promise(
			sources.forEach(source => {
				source.read().then(data => {
					if (data) {
						this.setData(data);
						break;
					}
				}
			})
		).then(this.initialize())
		 */
	}

	/**
	 * Initializes the BusinessData (changes the state from NEW to
	 * INITIALIZED)
	 */
	initialize() {
		// this.state = STATES.INITIALIZED;
	}

	/**
	 * Replaces the internal data with the one supplied.
	 *
	 * @param {Object} data
	 */
	setData(data) {
		// Must still be observable
	}
}

export default BusinessData;
export const STATES = {
	NEW: 0,
	INITIALIZING: 1,
	INITIALIZED: 2,
};
