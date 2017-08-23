import {
	reference,
	list,
	identifier,
	object,
	setDefaultModelSchema,
} from 'serializr';
import Product from './Product';

/**
 * A ProductCategory represents a category of products. It has a name and a list of Products. It can
 * also contain other product categories (sub-categories).
 */
class ProductCategory {
	/**
	 * UUID of the category.
	 *
	 * @type {String}
	 */
	// @serializable see below
	uuid = null;
	/**
	 * Name of the category.
	 *
	 * @type {String}
	 */
	// @serializable see below
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
	// @serializable see below
	products = [];
	/**
	 * List of sub-categories (also ProductCategory). It is guaranteed that a ProductCategory will
	 * not be child of 2 different categories.
	 *
	 * @type {Array<ProductCategory>}
	 */
	// @serializable see below
	categories = [];
}

/**
 * We define the modelSchema separately since ProductCategory has a circular dependency, so the
 * schema must exist before the class is created.
 *
 * @type {Object}
 */
const modelSchema = {
	factory: () => new ProductCategory(),
	props: {
		uuid: identifier(),
		name: true,
		products: list(reference(Product)),
		// See below for 'categories'
	},
};
// Since the categories prop references modelSchema, we set it after the schema declaration.
modelSchema.props.categories = list(object(modelSchema));

setDefaultModelSchema(ProductCategory, modelSchema);

export default ProductCategory;
