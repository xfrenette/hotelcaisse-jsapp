/**
 * Class to save log messages. It uses a system of namespace, so before being able to log, you must
 * call the getNamespace(namespace) method that will return an object containing the loggin methods.
 *
 * The returned object will have the following methods :
 * - error(message, data)
 * - warn(message, data)
 * - info(message, data)
 * - debug(message, data)
 * - trace(message, data)
 *
 * This specific implementation does nothing when a message is logged.
 */
const logMethods = ['error', 'warn', 'info', 'debug', 'trace'];

class Logger {
	/**
	 * Method that does the actual logging. It should not be called directly but through the methods
	 * in the object returned by getNamespace(namespace).
	 *
	 * @param {String} type
	 * @param {String} namespace
	 * @param {String} message
	 * @param {mixed} data
	 */
	// eslint-disable-next-line no-unused-vars
	log(type, namespace, message, data) {
		// This implementation does nothing, see children classes
	}

	/**
	 * Returns the object containing all the logging methods bound to the specified namespace.
	 *
	 * @param {String} namespace
	 * @return {Object}
	 */
	getNamespace(namespace) {
		const namespacedLog = {};
		const logger = this;

		logMethods.forEach((method) => {
			namespacedLog[method] = (message, data) => (
				logger.log.call(logger, method, namespace, message, data)
			);
		});

		return namespacedLog;
	}
}

export default Logger;
