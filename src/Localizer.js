/* eslint-disable no-underscore-dangle */
import Globalize from 'globalize';
import likelySubtags from 'cldr-data/supplemental/likelySubtags.json';
import numberingSystems from 'cldr-data/supplemental/numberingSystems.json';
import frCAnumbers from 'cldr-data/main/fr-CA/numbers.json';
import frCAcurrencies from 'cldr-data/main/fr-CA/currencies.json';
import currencyData from 'cldr-data/supplemental/currencyData.json';

const jsonFiles = [
	likelySubtags,
	numberingSystems,
	frCAnumbers,
	frCAcurrencies,
	currencyData,
];

Globalize.load(...jsonFiles);

class Localizer {
	/**
	 * Locale
	 *
	 * @type {String}
	 */
	locale = null;
	/**
	 * Currency
	 *
	 * @type {String}
	 */
	currency = null;
	/**
	 * Globalize instance setup with the locale
	 *
	 * @type {Globalize}
	 */
	globalize = null;

	constructor(locale = null, currency = null) {
		if (locale) {
			this.setLocale(locale);
		}

		if (currency) {
			this.setCurrency(currency);
		}
	}

	/**
	 * Sets the locale.
	 *
	 * @param {String} locale
	 */
	setLocale(locale) {
		this.locale = locale;
		this.createGlobalize();
	}

	/**
	 * Sets the currency.
	 *
	 * @param {String} currency
	 */
	setCurrency(currency) {
		this.currency = currency;
	}

	/**
	 * Returns the locale.
	 *
	 * @return {String}
	 */
	getLocale() {
		return this.locale;
	}

	/**
	 * Returns the currency.
	 *
	 * @return {String}
	 */

	getCurrency() {
		return this.currency;
	}

	/**
	 * Creates the local instance of the globalize with the locale.
	 *
	 * @return {[type]}
	 */
	createGlobalize() {
		this.globalize = new Globalize(this.locale);
	}

	/**
	 * Formats a number in the locale format.
	 *
	 * @param {Number} value
	 * @param {Object} options Options to pass to Globalize
	 * @return {String}
	 */
	formatNumber(value, options) {
		return this.globalize.formatNumber(value, options);
	}

	/**
	 * Formats a number using the locale and currency.
	 *
	 * @param {Number} value
	 * @param {Object} options
	 * @return {String}
	 */
	formatCurrency(value, options) {
		return this.globalize.formatCurrency(value, this.currency, options);
	}

	/**
	 * Rounds a number to the currency rounding rule. Ex: if the currency is CAD which rounds to
	 * 0.05 $, a value of 3.52 would be rounded to 3.50 and 3.53 would be rounded to 3.55. For
	 * currencies that do not round, the value is returned unchanged.
	 *
	 * @param {Number} value
	 * @return {Number}
	 */
	roundForCurrency(value) {
		const fractionData = this.globalize.cldr.supplemental(['currencyData/fractions', this.currency]);

		if (fractionData && fractionData._cashRounding) {
			const rounding = fractionData._cashRounding;
			const exp = fractionData._digits || 0;
			const unitMult = Math.pow(10, exp);
			let newValue = value * unitMult;
			newValue = Math.round(newValue / rounding) * rounding;
			return newValue / unitMult;
		}

		return value;
	}

	/**
	 * Parses a string of a number in the locale format and returns it. Returns NaN if cannot parse.
	 *
	 * @param {String} value
	 * @return {Number}
	 */
	parseNumber(value) {
		return this.globalize.parseNumber(value);
	}

	/**
	 * Returns the decimal separator symbol for this locale.
	 *
	 * @return {String}
	 */
	getDecimalSeparator() {
		return Globalize._numberSymbol('decimal', this.globalize.cldr);
	}
}

export default Localizer;
