const parseRegex = /([^=; ]+)=?([^;]+)?;?/g;

/**
 * Super lightweight cookie parser and serializer
 * @module cookie-lite
 */

/**
 * CookieJar class for managing cookies
 */
class CookieJar {
	constructor() {
		this.domainCookies = new Map();
	}

	/**
	 * Set a cookie in the jar
	 * @param {string} cookieString - Raw cookie string
	 * @param {string} domain - Cookie domain
	 * @param {string} [path] - Cookie path
	 */
	setCookie(cookieString, domain, path = '/') {
		// Parse the cookie string
		const cookieData = parse(cookieString);
		const [[name, value]] = Object.entries(cookieData);

		// Extract expires from cookie string if present
		let expires = null;
		const expiresMatch = cookieString.match(/Expires=([^;]+)/i);
		if (expiresMatch) {
			expires = new Date(expiresMatch[1]).getTime();
		}

		// Initialize domain and path Maps if they don't exist
		if (!this.domainCookies.has(domain)) {
			this.domainCookies.set(domain, new Map());
		}
		if (!this.domainCookies.get(domain).has(path)) {
			this.domainCookies.get(domain).set(path, new Map());
		}

		this.domainCookies.get(domain).get(path).set(name, {
			value,
			expires
		});
	}

	/**
	 * Get cookies for a specific domain and path
	 * @param {string} domain - Cookie domain
	 * @param {string} [path] - Cookie path
	 * @returns {Object} Object containing matching cookies
	 */
	getCookies(domain, path = '/') {
		const result = {};
		
		if (!this.domainCookies.has(domain)) {
			return result;
		}

		const domainCookies = this.domainCookies.get(domain);
		const paths = path === '/' ? ['/'] : ['/', path];

		for (const currentPath of paths) {
			if (domainCookies.has(currentPath)) {
				const pathCookies = domainCookies.get(currentPath);
				for (const [name, data] of pathCookies) {
					if (!this.isExpired(data.expires)) {
						result[name] = data.value;
					}
				}
			}
		}

		return result;
	}

	/**
	 * Clear cookies for a specific domain
	 * @param {string} domain - Cookie domain
	 */
	clearCookies(domain) {
		this.domainCookies.delete(domain);
	}

	/**
	 * Check if a cookie is expired
	 * @param {number} expires - Cookie expiration timestamp
	 * @returns {boolean} True if the cookie is expired
	 */
	isExpired(expires) {
		return expires !== null && expires < Date.now();
	}

	/**
	 * Clear all cookies from the jar
	 */
	clear() {
		this.domainCookies.clear();
	}
}

/**
 * Parse a cookie string
 * @param {string} cookieString - A cookie string
 * @returns {Object} Interpreted cookie data as an Object
 */
function parse(cookieString) {
	var currentPair = parseRegex.exec(cookieString);

	var outputPairs = {};

	while (currentPair !== null) {
		outputPairs[decodeURIComponent(currentPair[1])] = (currentPair[2] === null || currentPair[2] === undefined ? null : decodeURIComponent(currentPair[2]));
		currentPair = parseRegex.exec(cookieString);
	}

	return outputPairs;
}

/**
 * Serialize an object to cookie format
 * @param {Object} cookieData - Object to serialize to cookie string
 * @returns {string} Cookie string
 */
function serialize(cookieData) {
	return Object.entries(cookieData)
		.map(([key, value]) => 
			encodeURIComponent(key) + 
			(value === null ? '' : '=' + encodeURIComponent(value)))
		.join(';');
}

module.exports = {
	parse,
	serialize,
	CookieJar
};