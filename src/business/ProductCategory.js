import { serializable, reference, list, identifier } from 'serializr';
import Product from './Product';

/**
 * A ProductCategory represents a category of products. It has a name and a list of Products.
 */
class ProductCategory {
	/**
	 * UUID of the category.
	 *
	 * @type {String}
	 */
	@serializable(identifier())
	uuid = null;
	/**
	 * Name of the category.
	 *
	 * @type {String}
	 */
	@serializable
	name = null;
	/**
	 * List of Product.
	 *
	 * For the deserializing, we do not provide a lookup function since it is guaranteed that when
	 * this object is deserialized, the serialized data will contain all the required Product as well
	 * (the default lookup function looks in the deserialized object for references).
	 *
	 * @type {Array<Product>}
	 */
	@serializable(list(reference(Product)))
	products = [];
}

export default ProductCategory;
