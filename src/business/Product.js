import { serializable, identifier, list, object, getDefaultModelSchema, reference } from 'serializr';
import Decimal from 'decimal.js';
import { observable } from 'mobx';
import { decimal, productTax } from '../vendor/serializr/propSchemas';
import validate from '../Validator';
import utils from '../utils';

/**
 * Constraints for validation.
 *
 * @type {Object}
 */
const constraints = {
	name: {
		presence: true,
		typeOf: 'string',
	},
	price: {
		presence: true,
		decimal: { gt: 0 },
	},
};

/**
 * Represents a product sold by the business. Can represent an actual product (past or current) or
 * can represent a custom product for a specific order. A product can have variants, which are also
 * Products. If the Product is a variant, it has a parent Product.
 *
 * It must be clear that an instance of a Product does not necessarily represent a product
 * currently sold by the business. It can represent a product that was once sold, a custom product
 * or a product that was once a variant. It is only a class that represents a Product, no matter in
 * what context.
 *
 * For custom products, we can only set the price, we cannot set taxes.
 */
class Product {
	/**
	 * Id of the Product (defined by the server). It is possible it stays null (ex: for a
	 * custom product).
	 *
	 * @type {Integer|null}
	 */
	@serializable(identifier())
	id = null;
	/**
	 * Name of the product. If a variant, name of the variant.
	 *
	 * @type {String}
	 */
	@serializable
	name = '';
	/**
	 * Optional description of the product.
	 *
	 * @type {String}
	 */
	@serializable
	description = '';
	/**
	 * Price of the product before taxes. If a variant, price before taxes of the variant. It is
	 * observable since the price may change if it is a custom product.
	 *
	 * @type {Decimal}
	 */
	@serializable(decimal())
	@observable
	price = null;
	/**
	 * True if it represents a custom product.
	 *
	 * @type {Boolean}
	 */
	@serializable
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
	@serializable(list(productTax()))
	taxes = [];
	/**
	 * If this product is a variant, reference to the parent product. Else, null.
	 *
	 * For @serializable, see the constructor since a self-reference causes problems with Babel 6.
	 *
	 * @type {Product|null}
	 */
	// @serializable(reference(Product)) // see constructor
	parent = null;
	/**
	 * All the variants of this product. Empty array if no variants.
	 *
	 * For @serializable, see the constructor since a self-reference causes problems with Babel 6.
	 *
	 * @type {Array<Product>}
	 */
	// @serializable(list(object(Product))) // see constructor
	variants = [];

	constructor() {
		// Add serializable props that have self references
		getDefaultModelSchema(Product).props.variants = list(object(Product));
		getDefaultModelSchema(Product).props.parent = reference(Product);
	}

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
	 * If this product is a variant, returns a name built from the parent's name and this variant's
	 * name. If not a variant, returns the name.
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
	 * Adds a product variant and sets its parent to the current product.
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
	 * Creates a new Product based on this one. It is not a complete copy: it does not duplicate
	 * variants and the parent.
	 *
	 * @return {Product}
	 */
	clone() {
		const clone = new Product();
		clone.id = this.id;
		clone.name = this.name;
		clone.description = this.description;
		clone.taxes = [...this.taxes];
		clone.isCustom = this.isCustom;

		if (this.price) {
			clone.price = new Decimal(this.price);
		}

		return clone;
	}

	/**
	 * Validates itself (name and price)
	 *
	 * @return {Object}
	 */
	validate() {
		return Product.validate({
			name: this.name,
			price: this.price,
		});
	}
}

/**
 * Validates the values for a Product (will mainly be used when creating custom product). Will
 * validate only the attributes passed in values. Values is an object where the key is the
 * attribute and its value is the attribute's value. On success, returns undefined, else returns an
 * object with the error(s) for each attribute.
 *
 * @param {Object} values
 * @return {Object|undefined}
 */
Product.validate = (values) => {
	const appliedConstraints = utils.getConstraintsFor(constraints, values);
	return validate(values, appliedConstraints);
};

export default Product;
