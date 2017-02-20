/**
 * A Writer writes data received. This specific class should be extended, since it does nothing.
 */
class Writer {
	/**
	 * Writes the received data. The data must be a JavaScript literal that can be JSON encoded with
	 * JSON.stringify(). Returns a Promise that resolves when the writing is done.
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
