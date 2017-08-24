import RegisterModel from '../../business/Register';
import Plugin from '../Plugin';

/**
 * Plugin that tries to load a Register object from its reader when the plugin starts. If
 * successful, updates the `register` object in the Application instance. The start method will
 * resolve once the loading is finished, so it can be used to determine when the app loaded.
 */
class Register extends Plugin {
	id = 'loadOnInit.register';
	/**
	 * Reader where to read the Register
	 *
	 * @type {Reader}
	 */
	reader = null;

	constructor(reader) {
		super();
		this.reader = reader;
	}

	/**
	 * Reads from its reader. If a Register is returned updates the `register` property of
	 * this.application (passed in bootstrap()). Returns a Promise that resolves when everything is
	 * finished.
	 *
	 * Note : will update the register, instead or replacing it, because the Register instance in
	 * application is unique and we may have references to it in different places.
	 *
	 * @return {Promise}
	 */
	start() {
		return this.reader.read()
			.then((data) => {
				this.updateRegister(data);
			});
	}

	/**
	 * Updates the Register of the Application instance with the [newRegister] only if it is a valid
	 * Register (RegisterModel) instance.
	 *
	 * @param {RegisterModel} newRegister
	 */
	updateRegister(newRegister) {
		if (newRegister instanceof RegisterModel) {
			this.application.register.update(newRegister);
		}
	}
}

export default Register;
