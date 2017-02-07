import Decimal from 'decimal.js';

/**
 * Class that represents a Product. A Product can have variants
 * (which are also variants). Those variants have a parent
 * Product. Note that, in this system, an old Order may reference
 * products (instances of this class) that do not exist anymore
 * or that are modified. It must not be considered that if an Product
 * instance exists, that it exists as a still valid product for new
 * orders.
 */
class Product {
	/**
	 * Name of the product. If a variant, name of the variant.
	 *
	 * @type {String}
	 */
	name = '';
	/**
	 * Optionnal description of the product.
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
	 * Creates a "shallow" clone of this product. The cloning
	 * is "shallow" because the variants (and parent)
	 * are not cloned and not set in the returned Product.
	 *
	 * @return {Product}
	 */
	clone() {
		const clone = new Product();
		clone.name = this.name;
		clone.description = this.description;
		clone.taxes = [...this.taxes];

		if (this.price) {
			clone.price = new Decimal(this.price);
		}

		return clone;
	}
}

export default Product;
