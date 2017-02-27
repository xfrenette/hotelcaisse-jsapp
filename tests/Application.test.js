import Application from 'Application';
import Business from 'business/Business';

let application;

beforeEach(() => {
	application = new Application();
});

describe('constructor()', () => {
	test('sets config', () => {
		const config = { a: 'bb' };
		application = new Application(config);
		expect(application.config.getAll()).toEqual(config);
	});
});

describe('bootstrap()', () => {
	test('creates Business', () => {
		application.bootstrap();
		expect(application.business).toBeInstanceOf(Business);
	});

	test('does not create error if no plugins', () => {
		application.bootstrap();
		// No error should ne thrown
	});

	test('calls bootstrap of plugins', (done) => {
		const falsePlugins = [];
		const nb = 2;
		let nbCalled = 0;
		const bootstrap = (app) => {
			expect(app).toBe(application);
			nbCalled += 1;
			if (nbCalled === nb) {
				done();
			}
		};
		for (let i = nb - 1; i >= 0; i -= 1) {
			falsePlugins.push({ bootstrap });
		}
		application = new Application({
			plugins: falsePlugins,
		});
		application.bootstrap();
	});
});

describe('start()', () => {
	test('returns Promise', () => {
		expect(application.start()).toBeInstanceOf(Promise);
	});

	test('calls start of plugins', (done) => {
		const falsePlugins = [];
		const nb = 2;
		const start = jest.fn();
		for (let i = nb - 1; i >= 0; i -= 1) {
			falsePlugins.push({ start });
		}
		application = new Application({
			plugins: falsePlugins,
		});
		application.start()
			.then(() => {
				expect(start).toHaveBeenCalledTimes(nb);
				done();
			});
	});

	test('calls plugins\' start() sequentially (one at a time) (0.5 sec)', (done) => {
		let plugin1Finished = false;
		const plugin1 = {
			start() {
				return new Promise((resolve) => {
					setTimeout(() => { plugin1Finished = true; resolve(); }, 500);
				});
			},
		};
		const plugin2 = {
			start() {
				expect(plugin1Finished).toBe(true);
				done();
			},
		};
		application = new Application({
			plugins: [plugin1, plugin2],
		});
		application.start();
	});

	test('resolves after all plugin resolves (1 sec)', (done) => {
		let allFinished = false;
		const plugin1 = {
			start() {
				return new Promise((resolve) => {
					setTimeout(resolve, 500);
				});
			},
		};
		const plugin2 = {
			start() {
				return new Promise((resolve) => {
					setTimeout(() => {
						allFinished = true;
						resolve();
					}, 500);
				});
			},
		};
		application = new Application({
			plugins: [plugin1, plugin2],
		});
		application.start()
			.then(() => {
				expect(allFinished).toBe(true);
				done();
			});
	});
});

describe('setConfig', () => {
	test('sets config', () => {
		const config = { a: 'bb' };
		application.setConfig(config);
		expect(application.config.getAll()).toEqual(config);
	});

	test('does not set config if not object', () => {
		application.config.set = jest.fn();
		application.setConfig(null);
		application.setConfig();
		application.setConfig(true);
		expect(application.config.set ).not.toHaveBeenCalled();
	});
});
