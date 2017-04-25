import winston from 'winston';
import Logger from './Logger';

class WinstonLogger extends Logger {
	logger = null;

	constructor() {
		super();
		this.logger = new winston.Logger();
	}

	log(type, msg, data) {
		this.logger.log(type, msg, data);
	}

	addTransport(transport) {
		this.logger.add(transport);
	}
}

export default WinstonLogger;
