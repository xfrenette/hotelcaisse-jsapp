import BusinessModel from '../../business/Business';
import Plugin from '../Plugin';

/**
 * Plugin that tries to load a Business object from its reader when the plugin starts. If
 * successful, updates the Business object in the Application instance. The start method will
 * resolve once the loading is finished, so it can be used to determine when the app loaded.
 */
class Business extends Plugin {
	id = 'loadOnInit.business';
	/**
	 * Reader where to read the Business
	 *
	 * @type {Reader}
	 */
	reader = null;

	constructor(reader) {
		super();
		this.reader = reader;
	}

	/**
	 * Reads from its reader. If a Business is returned updates the business property of
	 * this.application (passed in bootstrap()). Returns a Promise that resolves when everything is
	 * finished.
	 *
	 * Note : will update the business, instead or replacing it, because the Business instance in
	 * application is unique and we may have references to it in different places.
	 *
	 * @return {Promise}
	 */
	start() {
		return this.reader.read()
			.then((data) => {
				this.updateBusiness(data);
			});
	}

	/**
	 * Updates the Business of the Application instance with the [newBusiness] only if it is a valid
	 * Business (BusinessModel) instance.
	 *
	 * @param {Business} newBusiness
	 */
	updateBusiness(newBusiness) {
		if (newBusiness instanceof BusinessModel) {
			this.application.business.update(newBusiness);
		}
	}
}

export default Business;
