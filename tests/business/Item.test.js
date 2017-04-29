import Item from 'business/Item';
import Product from 'business/Product';
import Decimal from 'decimal.js';
import { serialize, deserialize } from 'serializr';

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

describe('serializing', () => {
	let data;

	beforeEach(() => {
		product.name = 'test-name';
		item.product = product;
		item.quantity = 2;
		item.uuid = 'test-uuid',
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
		createdAt: (new Date()).getTime(),
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
