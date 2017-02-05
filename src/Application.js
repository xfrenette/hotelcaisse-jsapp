// TODO
import Config from './Config';

class Application {
	config = new Config();
	auth = null;
	businessData = null;
	plugins = [];

	/**
	 * If a config object is supplied, sets the config.
	 *
	 * @param {Object} config
	 */
	constructor(config = null) {

	}

	/**
	 * Creates all needed instances and bootstrap them. Also
	 * boostraps all plugins.
	 */
	bootstrap() {
		/*
		this.auth = this.config.get('auth');
		this.businessData = new BusinessData();
		this.plugins = this.config.get('plugins', []).map(plugin => {
			plugin.bootstrap(this)
			return plugin;
		})
		 */
	}

	/**
	 * Triggers all the actions needed at the start of the application.
	 * Also starts all the plugins. Returns a Promise that resolves
	 * when everything is started
	 *
	 * @return {Promise}
	 */
	start() {
		/*
		return Promise(
			this.auth.initFromSource(this.config.initialSources.auth);
			this.businessData.initFromSources(this.config.initialSources.businessData);
			this.plugins.forEach(plugin => {
					plugin.start()
		)
		 */
	}

	/**
	 * Sets application config from the object received.
	 *
	 * @param {object} config
	 */
	setConfig(config) {
		this.config.set(config);
	}
}

export default Application;
