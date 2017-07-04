/**
 * A Dual class is simply a merge of a Reader and a Writer class.
 */
class Dual {
	/**
	 * @see io/readers/Reader
	 * @return {Promise}
	 */
	read() {
		return Promise.resolve(null);
	}

	/**
	 * @see io/writers/Writer
	 * @return {Promise}
	 */
	// eslint-disable-next-line no-unused-vars
	write(data) {
		return Promise.resolve();
	}
}

export default Dual;
