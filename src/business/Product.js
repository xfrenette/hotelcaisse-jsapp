// TODO
/**
 * Class that represents a Product. A Product can have variants
 * (which are also variants). Those variants have a parent
 * Product.
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
}

export default Product;
