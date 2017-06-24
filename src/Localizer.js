/* eslint-disable no-underscore-dangle */
import utils from './utils';
import Globalize from 'globalize';
import get from 'lodash.get';
import likelySubtags from 'cldr-data/supplemental/likelySubtags.json';
import metaZones from 'cldr-data/supplemental/metaZones.json';
import timeData from 'cldr-data/supplemental/timeData.json';
import weekData from 'cldr-data/supplemental/weekData.json';
import numberingSystems from 'cldr-data/supplemental/numberingSystems.json';

import frCAcaGregorian from 'cldr-data/main/fr-CA/ca-gregorian.json';
import enCaGregorian from 'cldr-data/main/en/ca-gregorian.json';

import frCAtimeZoneNames from 'cldr-data/main/fr-CA/timeZoneNames.json';
import enTimeZoneNames from 'cldr-data/main/en/timeZoneNames.json';

import frCAnumbers from 'cldr-data/main/fr-CA/numbers.json';
import enNumbers from 'cldr-data/main/en/numbers.json';

import frCAcurrencies from 'cldr-data/main/fr-CA/currencies.json';
import enCurrencies from 'cldr-data/main/en/currencies.json';

import currencyData from 'cldr-data/supplemental/currencyData.json';
import plurals from 'cldr-data/supplemental/plurals.json';
import ordinals from 'cldr-data/supplemental/ordinals.json';

const jsonFiles = [
	likelySubtags,
	metaZones,
	timeData,
	weekData,
	numberingSystems,
	frCAnumbers,
	enNumbers,
	frCAcaGregorian,
	enCaGregorian,
	frCAtimeZoneNames,
	enTimeZoneNames,
	frCAcurrencies,
	enCurrencies,
	currencyData,
	plurals,
	ordinals,
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
	 * Strings in different locales.
	 *
	 * @type {Object}
	 */
	strings = {};
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
	 * Sets the strings object for the specified locale.
	 *
	 * @param {String} locale
	 * @param {Object} strings
	 */
	setStrings(locale, strings) {
		this.strings[locale] = strings;
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
	 * Formats a Date instance using the locale. Generally, the options will contain a 'skeleton'
	 * string attribute for the formatting.
	 *
	 * @see  http://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
	 * @see  https://github.com/globalizejs/globalize/blob/master/doc/api/date/date-formatter.md
	 *
	 * @param {Date} date
	 * @param {Object} options
	 * @return {String}
	 */
	formatDate(date, options = {}) {
		return this.globalize.formatDate(date, options);
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

	/**
	 * Returns the currency symbol.
	 *
	 * @return {String}
	 */
	getCurrencySymbol() {
		if (!this.currency) {
			return null;
		}

		const symbol = this.globalize.cldr.main([
			'numbers/currencies',
			this.currency,
			'symbol',
		]);

		return symbol;
	}

	/**
	 * Returns 1 or -1 if the currency symbol is before or after the number.
	 *
	 * @return {Number}
	 */
	getCurrencySymbolPosition() {
		if (!this.currency) {
			return -1;
		}

		const formattedCurrency = this.formatCurrency(1);
		const symbolPos = formattedCurrency.indexOf(this.getCurrencySymbol());

		return symbolPos === formattedCurrency.length - 1 ? 1 : -1;
	}

	/**
	 * Returns the string specified by the path in the current locale. If the string is not found,
	 * returns the path. If a [variables] object is passed, it is used for variables interpolation.
	 * Variables in the string must be declared as %{var_name}, ex: 'Hello %{name}'
	 *
	 * @param {String} path
	 * @param {Object} variables
	 * @return {String}
	 */
	t(path, variables = null) {
		if (!this.locale) {
			return path;
		}

		if (!this.strings[this.locale]) {
			return path;
		}

		let string = get(this.strings[this.locale], path, path);

		if (variables) {
			string = utils.stringInterpolation(string, variables);
		}

		return string;
	}
}

export default Localizer;
