// TODO
import Plugin from '../Plugin';

/**
 * Autosave plugin that saves the Auth data in storage everytime
 * Auth is modified.
 */
class Auth extends Plugin {
	storage = null;

	/**
	 * @param {DataSource} storage
	 */
	constructor(storage) {
		//this.storage = storage;
	}

	start() {
		// this.registerObservers()
	}

	/**
	 * Registers different observers on Auth
	 */
	registerObservers() {
		/*
		observe(this.application.auth.state || .token, this.saveAuth.bind(this))
		 */
	}

	/**
	 * Saves the Auth data in storage. Returns a Promise that
	 * resolves when saved.
	 *
	 * @return {Promise}
	 */
	saveAuth() {
		// return this.storage.write(this.application.auth.getData())
	}
}

export default Auth;
