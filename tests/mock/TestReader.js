class TestReader {
	data = null;
	succeed = true;

	constructor(data = null) {
		this.data = data;
	}

	read(channel) {
		if (this.succeed) {
			return Promise.resolve(this.data);
		} else {
			return Promise.reject();
		}
	}
}

export default TestReader;
