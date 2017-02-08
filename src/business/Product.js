import Decimal from 'decimal.js';

/**
 * Represents a product sold by the business. Can represent
 * an actual product (past or current) or can represent a
 * custom product for a specific order. A product can have
 * variants, which are also Products. If the Product is a
 * variant, it has a parent Product.
 *
 * It must be clear that an instance of a Product does not
 * necessarily represent a product currently sold by the
 * business. It can represent a product that was once sold,
 * a custom product or a product that was once a variant.
 * It is only a class that represents a Product, no matter
 * in what context.
 */
class Product {
	/**
	 * Name of the product. If a variant, name of the variant.
	 *
	 * @type {String}
	 */
	name = '';
	/**
	 * Optional description of the product.
	 *
	 * @type {String}
	 */
	description = '';
	/**
	 * Price of the product before taxes. If a variant,
	 * price before taxes of the variant.
	 *
	 * @type {Decimal}
	 */
	price = null;
	/**
	 * True if it represents a custom product.
	 *
	 * @type {Boolean}
	 */
	isCustom = false;
	/**
	 * List of taxes. Each element is an object:
	 * {
	 * 	name: <String>
	 * 	amount: <Decimal>
	 * }
	 *
	 * @type {Array}
	 */
	taxes = [];
	/**
	 * If this product is a variant, reference to the parent
	 * product. Else, null.
	 *
	 * @type {Product|null}
	 */
	parent = null;
	/**
	 * All the variants of this product. Empty array if no
	 * variants.
	 *
	 * @type {Array<Product>}
	 */
	variants = [];

	/**
	 * Returns true if this Product has variants.
	 *
	 * @return {Boolean}
	 */
	get hasVariants() {
		return this.variants.length > 0;
	}

	/**
	 * Returns true if this product is a variant of another one.
	 *
	 * @return {Boolean}
	 */
	get isVariant() {
		return this.parent !== null;
	}

	/**
	 * If this product is a variant, returns a name built
	 * from the parent's name and this variant's name. If
	 * not a variant, returns the name.
	 *
	 * @return {String}
	 */
	get extendedName() {
		if (this.isVariant) {
			return `${this.parent.extendedName} (${this.name})`;
		}

		return this.name;
	}

	/**
	 * Adds a product variant and sets its parent to the
	 * current product.
	 *
	 * @param {Product} product
	 */
	addVariant(product) {
		this.variants.push(product);
		product.parent = this;
	}

	/**
	 * Adds a tax for a unit of this product
	 *
	 * @param {String} name
	 * @param {Decimal} amount
	 */
	addTax(name, amount) {
		this.taxes.push({
			name,
			amount,
		});
	}

	/**
	 * Creates a new Product based on this one. It is not
	 * a complete copy: it does not duplicate variants and
	 * the parent.
	 *
	 * @return {Product}
	 */
	clone() {
		const clone = new Product();
		clone.name = this.name;
		clone.description = this.description;
		clone.taxes = [...this.taxes];
		clone.isCustom = this.isCustom;

		if (this.price) {
			clone.price = new Decimal(this.price);
		}

		return clone;
	}
}

export default Product;
