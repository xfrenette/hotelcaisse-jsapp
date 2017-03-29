/**
 * A Reader reads and returns the data it contains. This specific class should be extended, since
 * it does nothing.
 */
class Reader {
	/**
	 * Reads and returns the data stored in the specified channel. Returns a Promise that resolves
	 * with the stored data when the reading is done. If no data is present in the channel, returns
	 * null.
	 *
	 * @param {mixed} data
	 * @param {String} channel
	 * @return {Promise}
	 */
	// eslint-disable-next-line no-unused-vars
	read(channel) {
		return Promise.resolve(null);
	}
}

export default Reader;
