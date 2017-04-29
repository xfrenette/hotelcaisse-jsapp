import Config from './Config';
import Business from './business/Business';
import Logger from './loggers/Logger';

/**
 * Object representing the application. Once created, we call bootstrap() to bootstrap it and the
 * we call start() that starts all the plugins. Note that the Application does nothing
 * automatically after. All automatic actions are done by the plugins.
 */
class Application {
	/**
	 * Config object of the Application.
	 *
	 * @type {Config}
	 */
	config = new Config();
	/**
	 * Business instance.
	 *
	 * @type {Business}
	 */
	business = null;
	/**
	 * Logger instance of the application. The default one does nothing.
	 *
	 * @type {Logger}
	 */
	logger = new Logger();

	/**
	 * If a config object is supplied, sets the config.
	 *
	 * @param {Object} config
	 */
	constructor(config = null) {
		this.setConfig(config);
		this.setLogger(this.config.get('logger'));
	}

	/**
	 * Creates instance of Business and bootstraps all the plugins.
	 */
	bootstrap() {
		this.business = new Business();
		this.config.get('plugins', []).forEach((plugin) => {
			plugin.bootstrap(this);
		});
	}

	/**
	 * Starts the plugins sequentially. Returns a Promise that resolves once all plugins' start() has
	 * resolved.
	 *
	 * @return {Promise}
	 */
	start() {
		let promise = Promise.resolve();

		this.config.get('plugins', []).forEach((plugin) => {
			// The promise is redefined at each pass so plugins' start() are called sequentially.
			promise = promise.then(() => plugin.start());
		});

		return promise;
	}

	/**
	 * Sets application config from the object received.
	 *
	 * @param {object} config
	 */
	setConfig(config) {
		if (config !== null && typeof config === 'object') {
			this.config.set(config);
		}
	}

	/**
	 * Sets the logger.
	 *
	 * @param {Logger} newLogger
	 */
	setLogger(newLogger) {
		if (newLogger) {
			this.logger = newLogger;
		}
	}
}

export default Application;
