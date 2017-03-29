import EventEmitter from 'events';

/**
 * Writer that is used for the tests. Saves internally the data and emits 'write' event when write()
 * is called.
 */
class TestWriter extends EventEmitter {
	data = null;
	timeout = null;
	doFail = false;

	write(data) {
		this.data = data;
		this.emit('write', data);
		return this.getPromise();
	}

	setTimeout(time = null) {
		this.timeout = time;
	}

	fail(doFail = true) {
		this.doFail = doFail;
	}

	getPromise() {
		if (this.timeout !== null) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					if (this.doFail) {
						reject();
					} else {
						resolve();
					}
				}, this.timeout);
			});
		}

		if (this.doFail) {
			return Promise.reject();
		}

		return Promise.resolve();
	}
}

export default TestWriter;
