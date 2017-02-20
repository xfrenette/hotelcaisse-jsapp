/**
 * A Plugin is any class that will live with the application. Note: a plugin should wait the
 * bootstrap call before doing anything, since multiple instances are not yet created when the
 * constructor is called.
 */
class Plugin {
	/**
	 * Bootstrapping where the plugin may initialize data, but should not modify anything until
	 * start() is called.
	 */
	bootstrap() {
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
