// TODO
/**
 * Class that represents a Product. A Product can have variants
 * (which are also variants). Those variants have a parent
 * Product.
 */
class Product {
	name = '';
	description = '';
	price = null;
	taxes = [];
	parent = null;
	variants = null;

	/**
	 * Returns true if this Product has variants.
	 *
	 * @return {Boolean}
	 */
	get hasVariants() {

	}

	/**
	 * Returns true if this product is a variant of another one.
	 *
	 * @return {Boolean}
	 */
	get isVariant() {

	}
}

export default Product;
