import Reader from './reader';

/**
 * The First reader has an ordered list of Readers. Its read() function will itself sequentially
 * call the read() method of all its readers and returns the result of the first reader that doesn't
 * return null. Else, returns null.
 */
class First extends Reader {
	/**
	 * List of Reader the read method will query.
	 *
	 * @type {Array<Reader>}
	 */
	readers = [];

	constructor(readers = []) {
		super();
		this.readers = readers;
	}

	/**
	 * Call each readers' read() method (sequentially) and resolves with the first value that is not
	 * null. Else, resolves with null.
	 *
	 * @return {Promise}
	 */
	read() {
		let promise = Promise.resolve(null);

		/**
		 * We construct something similar to this (a kind of reduce function) :
		 *
		 * Promise.resolve(null)
		 * .then((prevData) => {
		 * 	// <ReaderBlock(1)>
		 * })
		 * .then((prevData) => {
		 * 	// <ReaderBlock(2)>
		 * })
		 * .then((prevData) => {
		 * 	// <ReaderBlock(3)>
		 * })
		 * ...
		 *
		 * Where ReaderBlock(n) :
		 * 	if prevData is not null, return it
		 * 	else, try this.readers[n].read()
		 * 		if resolve, return the data
		 * 		if fails, resolve with null
		 */
		this.readers.forEach((reader) => {
			promise = promise.then((prevData) => {
				if (prevData !== null) {
					return prevData;
				}

				return reader.read()
					.catch(() => null);
			});
		});

		return promise;
	}
}

export default First;
