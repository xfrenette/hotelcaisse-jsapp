import Item from 'business/Item';
import Product from 'business/Product';
import Decimal from 'decimal.js';
import { isObservable } from 'mobx';
import { deserialize, serialize } from 'serializr';

let item;
let parentProduct;
let product;

beforeEach(() => {
	item = new Item();

	parentProduct = new Product();
	parentProduct.name = 'Parent product';

	product = new Product();
	product.name = 'Product name';
	product.price = new Decimal(12.95);
	product.addTax('tax1', new Decimal(1.25));
	product.addTax('tax2', new Decimal(2.33));

	parentProduct.addVariant(product);
});

describe('constructor()', () => {
	test('sets createdAt time', () => {
		expect(item.createdAt).toBeInstanceOf(Date);
	});

	test('sets uuid', () => {
		const uuid = 'test-uuid';
		item = new Item(uuid);
		expect(item.uuid).toBe(uuid);
	});
});

describe('quantity', () => {
	test('is observable', () => {
		expect(isObservable(item, 'quantity')).toBe(true);
	});
});

describe('product', () => {
	test('is observable', () => {
		expect(isObservable(item, 'product')).toBe(true);
	});
});

describe('unitPrice', () => {
	test('returns right value', () => {
		item.product = product;
		const expected = product.price;
		expect(item.unitPrice.eq(expected)).toBe(true);
	});

	test('works with product after freezeProduct()', () => {
		item.product = product;
		item.freezeProduct();
		const expected = product.price;
		expect(item.unitPrice.eq(expected)).toBe(true);
	});

	test('returns 0 if product has no price', () => {
		const customProduct = new Product();
		customProduct.price = null;
		item.product = customProduct;
		expect(item.unitPrice.toNumber()).toBe(0);
	});

	test('is observable', () => {
		expect(isObservable(item, 'unitPrice')).toBe(true);
	});
});

describe('name', () => {
	test('returns product\'s extendedName', () => {
		item.product = product;
		expect(item.name).toBe(product.extendedName);
	});

	test('works after freezeProduct()', () => {
		item.product = product;
		item.freezeProduct();
		expect(item.name).toBe(product.extendedName);
	});
});

describe('subtotal', () => {
	test('works with quantity', () => {
		item.product = product;
		[-1, 0, 2].forEach((quantity) => {
			item.quantity = quantity;
			const expected = product.price.mul(quantity);
			expect(item.subtotal.eq(expected)).toBeTruthy();
		});
	});

	test('is observable', () => {
		expect(isObservable(item, 'subtotal')).toBe(true);
	});
});

describe('unitTaxes', () => {
	test('returns product taxes', () => {
		item.product = product;
		expect(item.unitTaxes).toEqual(product.taxes);
	});

	test('works after freezeProduct()', () => {
		item.product = product;
		item.freezeProduct();
		expect(item.unitTaxes).toEqual(product.taxes);
	});
});

describe('taxesTotals', () => {
	test('works with product', () => {
		item.product = product;
		[-2, 0, 2].forEach((quantity) => {
			item.quantity = quantity;
			const expected	= product.taxes.map(
				({ name, amount }) => ({ name, amount: amount.mul(quantity) })
			);
			expect(item.taxesTotals).toEqual(expected);
		});
	});

	test('is observable', () => {
		expect(isObservable(item, 'taxesTotals')).toBe(true);
	});
});

describe('unitFullPrice', () => {
	test('works with taxes', () => {
		item.product = product;
		const expected = product.taxes.reduce(
			(prev, { amount }) => prev.add(amount),
			item.unitPrice
		);
		expect(item.unitFullPrice.eq(expected)).toBeTruthy();
	});

	test('works without taxes', () => {
		const tmpProduct = new Product();
		tmpProduct.price = new Decimal(1);
		item.product = tmpProduct;
		expect(item.unitFullPrice.eq(tmpProduct.price)).toBeTruthy();
	});

	test('is observable', () => {
		expect(isObservable(item, 'unitFullPrice')).toBe(true);
	});
});

describe('total', () => {
	test('works with product', () => {
		item.product = product;
		[-2, 0, 2].forEach((quantity) => {
			item.quantity = quantity;
			const expected = item.unitFullPrice.mul(quantity);
			expect(item.total.eq(expected)).toBeTruthy();
		});
	});

	test('is observable', () => {
		expect(isObservable(item, 'taxesTotals')).toBe(true);
	});
});

describe('freezeProduct()', () => {
	test('clones the Product', () => {
		product.clone = jest.fn(() => new Product());
		item.product = product;
		item.freezeProduct();
		expect(product.clone).toHaveBeenCalled();
	});

	test('replaces the product with the clone', () => {
		item.product = product;
		item.freezeProduct();
		expect(item.product).not.toBe(product);
	});

	test('sets the product name to its extendedName', () => {
		const expected = product.extendedName;
		item.product = product;
		item.freezeProduct();
		expect(item.product.name).toBe(expected);
	});
});

describe('validate()', () => {
	test('rejects invalid quantity', () => {
		item.quantity = 0;
		const res = item.validate();
		expect(res).toEqual(expect.objectContaining({
			quantity: expect.any(Array),
		}));
	});

	test('rejects if a product is invalid', () => {
		product.price = null;
		item.product = product;

		const res = item.validate();
		expect(res).toEqual(expect.objectContaining({
			product: expect.any(Array),
		}));
	});

	test('validates if all valid', () => {
		item.product = product;
		expect(item.validate()).toBeUndefined();
	});
});

describe('static validate()', () => {
	test('rejects invalid quantity', () => {
		const invalidValues = [undefined, null, 0.5, 0];
		invalidValues.forEach((value) => {
			expect(Item.validate({ quantity: value })).not.toBeUndefined();
		});
	});

	test('rejects invalid product', () => {
		const invalidValues = [undefined, null, new Item()];
		invalidValues.forEach((value) => {
			expect(Item.validate({ product: value })).not.toBeUndefined();
		});
	});

	test('validates valid data', () => {
		const values = {
			quantity: 3,
			product,
		};
		expect(Item.validate(values)).toBeUndefined();
	});
});

describe('serializing', () => {
	let data;

	beforeEach(() => {
		product.name = 'test-name';
		item.product = product;
		item.quantity = 2;
		item.uuid = 'test-uuid';
		data = serialize(item);
	});

	test('saves primitives', () => {
		expect(data.quantity).toBe(item.quantity);
		expect(data.uuid).toBe(item.uuid);
		expect(data.createdAt).toEqual(expect.any(Number));
	});

	test('saves product', () => {
		expect(data.product.name).toBe(product.name);
	});
});

describe('deserializing', () => {
	let restoredItem;
	const data = {
		product: {
			name: 'test-name',
		},
		quantity: 2,
		uuid: 'test-uuid',
		createdAt: Math.round((new Date()).getTime() / 1000),
	};

	beforeEach(() => {
		restoredItem = deserialize(Item, data);
	});

	test('restores primitives', () => {
		expect(restoredItem.quantity).toBe(data.quantity);
		expect(restoredItem.uuid).toBe(data.uuid);
		expect(restoredItem.createdAt).toBeInstanceOf(Date);
	});

	test('restores product', () => {
		expect(restoredItem.product).toBeInstanceOf(Product);
		expect(restoredItem.product.name).toBe(data.product.name);
	});
});
