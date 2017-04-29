/**
 * A Plugin is any class that will live with the application. Note: a plugin should wait the
 * bootstrap call before doing anything, since multiple instances are not yet created when the
 * constructor is called.
 */
class Plugin {
	/**
	 * Application that executes this Plugin.
	 *
	 * @type {Application}
	 */
	application = null;
	/**
	 * Unique id of this plugin
	 *
	 * @type {String}
	 */
	id = '--plugin-no-id--';
	/**
	 * Namespaced logger
	 *
	 * @type {Logger}
	 */
	log = null;

	/**
	 * Bootstrapping where the plugin may initialize data, but should not modify anything until
	 * start() is called. Receives the Application in parameter. Also sets up a logger namespaced
	 * with the plugin id.
	 *
	 * @param {Application} app
	 */
	bootstrap(application) {
		this.application = application;
		this.createLogger();
	}

	/**
	 * Saves in this.log a namespaced logger created from application.logger.
	 */
	createLogger() {
		this.log = this.application.logger.getNamespace(this.id);
	}

	/**
	 * When start is called, the application is ready. Returns a Promise when finished.
	 *
	 * @return {Promise}
	 */
	start() {
	}
}

export default Plugin;
