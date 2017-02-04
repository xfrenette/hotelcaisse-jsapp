/* eslint-disable class-methods-use-this */
/**
 * Abstract class that represents a source of data where data
 * can be read or written to.
 */
class DataSource {
	/**
	 * Returns a Promise object that resolves with the data
	 * contained in the source.
	 *
	 * @return {Promise}
	 */
	read() {
		return Promise.resolve(null);
	}

	/**
	 * Writes data to the source. Returns a Promise object that
	 * resolves when the writting finishes.
	 *
	 * @param {mixed} data
	 * @return {Promise}
	 */
	write(data) { // eslint-disable-line no-unused-vars
		return Promise.resolve();
	}
}

export default DataSource;
