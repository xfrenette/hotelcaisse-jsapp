/**
 * A Reader reads and returns the data it contains. This specific class should be extended, since
 * it does nothing.
 */
class Reader {
	/**
	 * Reads and returns the data it contains. Returns a Promise that resolves with the stored data
	 * when the reading is done. If no data, returns null.
	 *
	 * @param {mixed} data
	 * @return {Promise}
	 */
	read() {
		return Promise.resolve(null);
	}
}

export default Reader;
