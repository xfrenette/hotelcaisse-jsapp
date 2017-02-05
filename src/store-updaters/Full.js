// TODO
import StoreUpdater from './StoreUpdater';

/**
 * With the 'Full' StoreUpdater, the update(data) method
 * completely overwrites the data by returning as-is the
 * loaded data from the DataSource.
 */
class Full extends StoreUpdater {
	/**
	 * Returns the loaded data as-is
	 *
	 * @return {Object}
	 */
	update() {
		return this.loadedData;
	}
}

export default Full;
