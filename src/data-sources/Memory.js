// TODO
import DataSource from './DataSource';

/**
 * The Memory DataSource simply saves in a JavaScript reference
 * the data it was submitted.
 *
 * @see DataSource
 */
class Memory extends DataSource {
	data = null;

	/**
	 * Internally save the data and immediately resolve.
	 * @see DataSource#write
	 *
	 * @param {mixed} data
	 * @return {Promise}
	 */
	write(data) {
		this.data = data;
		return Promise.resolve();
	}

	/**
	 * Returns a Promise that immediately resolves with this.data
	 * @see DataSource#read
	 *
	 * @return {[type]}
	 */
	read() {
		return Promise.resolve(this.data);
	}
}

export default Memory;
