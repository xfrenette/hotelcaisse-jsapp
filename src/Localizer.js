import Globalize from 'globalize';
import likelySubtags from 'cldr-data/supplemental/likelySubtags.json';
import numberingSystems from 'cldr-data/supplemental/numberingSystems.json';
import frCAnumbers from 'cldr-data/main/fr-CA/numbers.json';

const jsonFiles = [
	likelySubtags,
	numberingSystems,
	frCAnumbers,
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
	 * Globalize instance setup with the locale
	 *
	 * @type {Globalize}
	 */
	globalize = null;

	constructor(locale = null) {
		if (locale) {
			this.setLocale(locale);
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
	 * Returns the locale.
	 *
	 * @return {String}
	 */
	getLocale() {
		return this.locale;
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
	 * @return {String}
	 */
	formatNumber(value) {
		return this.globalize.formatNumber(value);
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
