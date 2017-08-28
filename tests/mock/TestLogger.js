import Logger from 'loggers/Logger';

class TestLogger extends Logger {
	log(type, namespace, message, data) {
		// Do nothing
	}
}

export default TestLogger;
