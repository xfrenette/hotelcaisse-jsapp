import Application from 'Application';

let application;
let autorunHandler;

beforeEach(() => {
	application = new Application();
});

afterEach(() => {
	if (autorunHandler) {
		autorunHandler();
		autorunHandler = null;
	}
});
