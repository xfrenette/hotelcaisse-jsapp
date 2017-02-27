/**
 * A Writer writes data received. This specific class should be extended, since it does nothing.
 */
class Writer {
	/**
	 * Writes the received data. The data must be a JavaScript literal that can be JSON encoded with
	 * JSON.stringify(). Returns a Promise that resolves when the writing is done.
	 *
	 * A second optional parameter may be supplied indicating a channel where to save the data. This
	 * is generally used to put data in different places, represented by the channel. Ex: a Writer
	 * might use the channel as a file name, an object key, a URL part, etc.
	 *
	 * @param {mixed} data
	 * @param {String} channel
	 * @return {Promise}
	 */
	// eslint-disable-next-line no-unused-vars
	write(data, channel) {
		return Promise.resolve();
	}
}

export default Writer;
