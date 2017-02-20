import EventEmitter from 'events';

/**
 * Writer that is used for the tests. Saves internally the data and emits 'write' event when write()
 * is called.
 */
class TestWriter extends EventEmitter {
	data = null;

	write(data) {
		this.data = data;
		this.emit('write', data);
		return Promise.resolve();
	}
}

export default TestWriter;
