import Plugin from '../Plugin';

const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Plugin that triggers a 'ping' request on the API at fixed time interval
 */
class Ping extends Plugin {
	/**
	 * Unique id of this plugin
	 *
	 * @type {String}
	 */
	id = 'apiServer.ping';
	/**
	 * Api server instance
	 * @type {Api}
	 */
	server = null;
	/**
	 * At which interval to ping (number of milliseconds)
	 * @type {number}
	 */
	interval = null;
	/**
	 * Interval ref if we want to cancel the interval
	 * @type {number}
	 */
	ref = null;

	constructor(server, interval = PING_INTERVAL) {
		super();
		this.interval = interval;
		this.server = server;
	}

	/**
	 * On start, start the pings
	 */
	start() {
		this.startPings();
	}

	/**
	 * Starts the pings. Does a first ping immediately, then the following at each `interval`
	 */
	startPings() {
		this.server.ping();

		this.ref = setInterval(() => {
			this.server.ping();
		}, this.interval);
	}

	/**
	 * Stops the automatic pings
	 */
	stopPings() {
		clearInterval(this.ref);
	}
}

export default Ping;
