/**
 * Default loggerthat other loggers should extend. This instance will not do anything but has some
 * methods implemented that implementations may use.
 */
class Logger {
	// eslint-disable-next-line no-unused-vars
	log(type, msg, data) {

	}

	error(msg, data) {
		this.log('error', msg, data);
	}

	warn(msg, data) {
		this.log('warn', msg, data);
	}

	info(msg, data) {
		this.log('info', msg, data);
	}

	verbose(msg, data) {
		this.log('verbose', msg, data);
	}

	debug(msg, data) {
		this.log('debug', msg, data);
	}

	silly(msg, data) {
		this.log('silly', msg, data);
	}

	/**
	 * Returns an object with all the same logging methods as a Logger, but every
	 * logged message will be prepended with the namespace.
	 *
	 * @param {String} namespace
	 * @return {Object}
	 */
	withNamespace(namespace) {
		const methods = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];
		const proxy = {};
		const logger = this;

		methods.forEach((method) => {
			proxy[method] = (rawMsg, data) => {
				const msg = logger.formatWithNamespace.call(logger, namespace, rawMsg);
				return logger[method].call(logger, msg, data);
			};
		});

		// Special case for "log"
		proxy.log = (type, rawMsg, data) => {
			const msg = logger.formatWithNamespace.call(logger, namespace, rawMsg);
			return logger.log.call(logger, type, msg, data);
		};

		return proxy;
	}

	formatWithNamespace(namespace, msg) {
		return `${namespace} : ${msg}`;
	}
}

export default Logger;
