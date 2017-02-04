/**
 * A StoreUpdater loads data from a DataSource and can update
 * the data of the store. See extending classes for actual
 * implementation.
 */
class StoreUpdater {
	loadedData = null;
	dataSource = null;

	constructor(dataSource) {
		this.dataSource = dataSource;
	}

	/**
	 * Loads the store data from the data source. Returns a
	 * promise that resolves when the loading is done.
	 *
	 * @return {Promise}
	 */
	load() {
		return this.dataSource.read().then((data) => {
			this.loadedData = data;
		});
	}

	/**
	 * From the received store data object, returns a new object
	 * where the store data was updated with the last loaded data.
	 *
	 * @param {Object} data
	 * @return {Object}
	 */
	update(data) {
		// This implementation only returns a shallow copy of the data
		return {
			...data,
		};
	}
}

export default StoreUpdater;
