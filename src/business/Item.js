/**
 * An Item represents an entry in an order. It generaly is
 * a specific product with a quantity. It can also be a
 * refunded item or a custom entry.
 */
class Item {
	product = null; // Can be a variant
	quantity = 1;
	customPrice = false;
	customName = null; // In case of custom item
	createdAt = null;

	/**
	 * Returns the unit price of this item, before taxes.
	 *
	 * @return {Decimal}
	 */
	get unitPrice() {

	}

	/**
	 * Returns the unit price of this item, including taxes.
	 *
	 * @return {Decimal}
	 */
	get unitPriceFull() {

	}

	/**
	 * Returns an array of tax totals where each entry is an
	 * object with 'name' and 'amount' keys. The returned taxes
	 * are for the total (all quantities).
	 *
	 * [
	 * 	{name:<String>,amount:<Decimal>}
	 * ]
	 *
	 * @return {array}
	 */
	get taxTotals() {

	}

	/**
	 * Returns total before taxes
	 * quantity() * unitPrice()
	 *
	 * @return {[type]}
	 */
	get subTotal() {

	}

	/**
	 * Returns total including taxes
	 * quantity() * unitPriceFull()
	 *
	 * @return {Decimal}
	 */
	get total() {

	}
}

export default Item;
