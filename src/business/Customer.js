import { serializable } from 'serializr';

// TODO
class Customer {
	@serializable
	name = '';

	/**
	 * Returns a clone of this Customer (a new object)
	 *
	 * @return {Customer}
	 */
	clone() {
		const newCustomer = new Customer();
		newCustomer.name = this.name;

		return newCustomer;
	}

	/**
	 * Returns true if this Customer is equal (same values) as the other Customer.
	 *
	 * @param {Customer} other
	 * @return {Boolean}
	 */
	isEqualTo(other) {
		return this.name === other.name;
	}
}

export default Customer;
