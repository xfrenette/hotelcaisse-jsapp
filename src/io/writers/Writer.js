/**
 * A Writer writes data received. This specific class should be extended, since it does nothing.
 */
class Writer {
	/**
	 * Writes data. Returns a Promise that resolves when the writing is done. Note that it is the job
	 * of the Writer to JSON encode if it requires.
	 *
	 * @param {mixed} data
	 * @return {Promise}
	 */
	// eslint-disable-next-line no-unused-vars
	write(data) {
		return Promise.resolve();
	}
}

export default Writer;
