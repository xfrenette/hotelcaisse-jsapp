import { computed, observable } from 'mobx';
import { identifier, object, serializable } from 'serializr';
import Decimal from 'decimal.js';
import { timestamp } from '../vendor/serializr/propSchemas';
import Product from './Product';
import validate from '../Validator';
import utils from '../utils';

/**
 * Constraints for validation.
 *
 * @type {Object}
 */
const constraints = {
	quantity: {
		presence: true,
		numericality: {
			onlyInteger: true,
		},
		exclusion: [0],
	},
	product: {
		presence: true,
		instanceOf: {
			class: Product,
		},
	},
};

/**
 * An Item, made to be used in Order, represents the combination of a Product with a quantity. If
 * the quantity is positive, it represents a Product being bought by a customer. If it is negative,
 * it represents a refunded Product.
 *
 * When an Item is used in an Order, it is important to keep the Product as it was at the time of
 * creation. For example, if the Product changes price after the Order was created, the Item must
 * have the Product as it was at the time. That is why Item has a freezeProduct() method that keeps
 * the Product "frozen" (it keeps a clone of it).
 */
class Item {
	/**
	 * UUID of this Item.
	 *
	 * @type {String}
	 */
	@serializable(identifier())
	uuid = null;
	/**
	 * The product of the Item.
	 *
	 * @type {Product}
	 */
	@serializable(object(Product))
	@observable
	product = null;
	/**
	 * Quantity of the Item. Can be negative (when a refunded Item).
	 *
	 * @type {Number}
	 */
	@observable
	@serializable
	quantity = 1;
	/**
	 * Creation date time. Note that it will probably be set again when the Order is saved.
	 *
	 * @type {Date}
	 */
	@serializable(timestamp())
	createdAt = null;

	constructor(uuid = null) {
		this.createdAt = new Date();
		this.uuid = uuid;
	}

	get name() {
		return this.product.extendedName;
	}

	/**
	 * Returns the unit price of this item, before taxes. If the product has no price (ex: we are
	 * creating a custom product and we didn't give it a price yet), returns 0.
	 *
	 * It is observable since the price of a product is observable
	 *
	 * @return {Decimal}
	 */
	@computed
	get unitPrice() {
		const price = this.product.price;

		if (price === null) {
			return new Decimal(0);
		}

		return price;
	}

	/**
	 * Returns an array of AppliedTax for a unit.
	 *
	 * @return {array<AppliedTax>}
	 */
	get unitTaxes() {
		return [...this.product.taxes];
	}

	/**
	 * Returns the unit price of this item, including taxes. It is observable since the product price
	 * is observable.
	 *
	 * @return {Decimal}
	 */
	@computed
	get unitFullPrice() {
		return this.unitTaxes.reduce(
			(prev, tax) => prev.add(tax.amount),
			this.unitPrice
		);
	}

	/**
	 * Returns total before taxes
	 * quantity() * unitPrice()
	 *
	 * @return {Decimal}
	 */
	@computed
	get subtotal() {
		return this.unitPrice.mul(this.quantity);
	}

	/**
	 * Same as unitTaxes, but multiplied by the quantity.
	 *
	 * @return {array}
	 */
	@computed
	get taxesTotals() {
		return this.unitTaxes.map((tax) => {
			const unitTax = tax.clone();
			unitTax.amount = tax.amount.mul(this.quantity);
			return unitTax;
		});
	}

	/**
	 * Returns total including taxes
	 * quantity() * unitFullPrice()
	 *
	 * @return {Decimal}
	 */
	@computed
	get total() {
		return this.unitFullPrice.mul(this.quantity);
	}

	/**
	 * Freezes the Product (creates and saves a copy of it). Sets the name of the new Product to the
	 * extendedName of the original one.
	 */
	freezeProduct() {
		const extendedName = this.product.extendedName;
		this.product = this.product.clone();
		this.product.name = extendedName;
	}

	/**
	 * Validates its own properties (quantity) and its product
	 *
	 * @return {Object}
	 */
	validate() {
		let res = Item.validate({
			quantity: this.quantity,
			product: this.product,
		});

		if (this.product && !!this.product.validate()) {
			res = res || {};
			res.product = ['The product is invalid'];
		}

		return res;
	}
}

/**
 * Validates the attributes of an Item. Will validate only the attributes passed in values. Values
 * is an object where the key is the attribute and its value is the attribute's value. On success,
 * returns undefined, else returns an object with the error(s) for each attribute.
 *
 * @param {Object} values
 * @return {Object|undefined}
 */
Item.validate = (values) => {
	const appliedConstraints = utils.getConstraintsFor(constraints, values);
	return validate(values, appliedConstraints);
};

export default Item;
