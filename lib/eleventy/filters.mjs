import { DateTime } from 'luxon';

export default {
	currentYear: function () {
		return new Date().getFullYear();
	},

	dateToFormat: function (date, format) {
		return DateTime.fromJSDate(date, { zone: 'utc' }).toFormat(String(format));
	},

	dateToISO: function (date) {
		return DateTime.fromJSDate(date, { zone: 'utc' }).toISO({
			includeOffset: false,
			suppressMilliseconds: true,
		});
	},

	filterTagList(tags) {
		return (tags || []).filter(
			(tag) => ['all', 'nav', 'post', 'posts'].indexOf(tag) === -1,
		);
	},

	getKeys: function (target) {
		return Object.keys(target);
	},

	head: function (array, n) {
		if (!Array.isArray(array) || array.length === 0) {
			return [];
		}
		if (n < 0) {
			return array.slice(n);
		}

		return array.slice(0, n);
	},

	min: function (...numbers) {
		return Math.min.apply(null, numbers);
	},

	obfuscate: function (str) {
		const chars = [];
		for (var i = str.length - 1; i >= 0; i--) {
			chars.unshift(['&#', str[i].charCodeAt(), ';'].join(''));
		}
		return chars.join('');
	},

	// Fixed: was missing return statement and had parameters reversed
	sortAlphabetically: function (strings) {
		return [...(strings || [])].sort((a, b) => a.localeCompare(b));
	},
};
