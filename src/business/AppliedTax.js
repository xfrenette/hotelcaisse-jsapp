import { serializable } from 'serializr';
import Decimal from 'decimal.js';
import { decimal } from '../vendor/serializr/propSchemas';

class AppliedTax {
	/**
	 * Id of the reference Tax object. Note that the Tax object is, for now, only on the server,
	 * not in the JS.
	 *
	 * @type {number}
	 */
	@serializable
	taxId = null;
	/**
	 * Absolute amount of the applied tax.
	 *
	 * @type {Decimal}
	 */
	@serializable(decimal())
	amount = null;
	/**
	 * Name of the applied tax.
	 *
	 * @type {Decimal}
	 */
	@serializable
	name = null;

	/**
	 * @param {number} taxId
	 * @param {string} name
	 * @param {Decimal} amount
	 */
	constructor(taxId = null, name = null, amount = null) {
		this.taxId = taxId;
		this.name = name;
		this.amount = amount;
	}

	/**
	 * Returns a copy of this AppliedTax
	 *
	 * @returns {AppliedTax}
	 */
	clone() {
		return new AppliedTax(this.taxId, this.name, new Decimal(this.amount));
	}

	/**
	 * Returns true if `other` is equal to this instance.
	 *
	 * @param {AppliedTax} other
	 * @returns {boolean}
	 */
	equals(other) {
		return other.taxId === this.taxId
			&& other.name === this.name
			&& other.amount.equals(this.amount);
	}
}

export default AppliedTax;
