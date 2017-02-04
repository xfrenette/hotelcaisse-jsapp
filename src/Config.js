import get from 'lodash.get';

/**
 * Class to store configurations.
 */
class Config {
	/**
	 * Holds the configuration object
	 *
	 * @type {Object}
	 */
	config = {};

	/**
	 * Sets the configuration object
	 *
	 * @param {Object} config
	 */
	set(config) {
		this.config = config;
	}

	/**
	 * Retrieves the configuration value defined by key.
	 * If this configuration doesn't exist, returns the
	 * default value. The default value defaults to undefined.
	 *
	 * @param {string} key
	 * @param {mixed} defaultValue
	 * @return {mixed}
	 */
	get(key, defaultValue) {
		return get(this.config, key, defaultValue);
	}

	getAll() {
		return this.config;
	}
}

export default Config;
