import { observable, computed } from 'mobx';
import { serializable, date, object, identifier } from 'serializr';
import Decimal from 'decimal.js';
import Product from './Product';

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
	@serializable(date())
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
	 * Returns an array of taxes applied to the unit price.
	 * Each entry is an object :
	 *
	 * {name:<String>, amount:<Decimal>}
	 *
	 * @return {array}
	 */
	get unitTaxes() {
		return this.product.taxes;
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
			(prev, { amount }) => prev.add(amount),
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
		return this.unitTaxes.map(
			({ name, amount }) => ({ name, amount: amount.mul(this.quantity) })
		);
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
}

export default Item;
