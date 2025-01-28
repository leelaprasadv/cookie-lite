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
		this.cookies = {};
		this.domainCookies = new Map(); // Additional storage for domain-specific cookies
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
			expires = new Date(expiresMatch[1]);
		}

		// Store in domain-specific storage
		if (!this.domainCookies.has(domain)) {
			this.domainCookies.set(domain, new Map());
		}
		if (!this.domainCookies.get(domain).has(path)) {
			this.domainCookies.get(domain).set(path, new Map());
		}

		this.domainCookies.get(domain).get(path).set(name, {
			value,
			expires: expires ? expires.getTime() : null
		});

		// Also store in the original format for backward compatibility
		this.setCookieOriginal(name, value, {
			expires,
			path,
			domain
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
		
		// Get root path cookies
		if (domainCookies.has('/')) {
			const rootCookies = domainCookies.get('/');
			for (const [name, data] of rootCookies) {
				if (!this.isExpired(data.expires)) {
					result[name] = data.value;
				}
			}
		}

		// Get path-specific cookies
		if (path !== '/' && domainCookies.has(path)) {
			const pathCookies = domainCookies.get(path);
			for (const [name, data] of pathCookies) {
				if (!this.isExpired(data.expires)) {
					result[name] = data.value;
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
		// Clear matching cookies from the original storage
		for (const [name, cookie] of Object.entries(this.cookies)) {
			if (cookie.options.domain === domain) {
				delete this.cookies[name];
			}
		}
	}

	/**
	 * Check if a cookie is expired
	 * @param {number} expires - Cookie expiration timestamp
	 * @returns {boolean} True if the cookie is expired
	 */
	isExpired(expires) {
		return expires !== null && expires < Date.now();
	}

	// Rename original setCookie to setCookieOriginal for internal use
	setCookieOriginal(name, value, options = {}) {
		if (!name || typeof name !== 'string') {
			throw new Error('Cookie name must be a non-empty string');
		}

		const cookie = {
			value: value,
			options: {
				expires: options.expires || null,
				path: options.path || '/',
				domain: options.domain || null,
				secure: options.secure || false,
				httpOnly: options.httpOnly || false
			}
		};

		this.cookies[name] = cookie;
		this._removeExpiredCookies();
	}

	/**
	 * Get a cookie from the jar
	 * @param {string} name - Cookie name
	 * @param {Object} [matchOptions] - Options to match against
	 * @param {string} [matchOptions.path] - Cookie path to match
	 * @param {string} [matchOptions.domain] - Cookie domain to match
	 * @param {boolean} [matchOptions.secure] - Match secure flag
	 * @param {boolean} [matchOptions.httpOnly] - Match httpOnly flag
	 * @returns {string|null} Cookie value or null if not found or if options don't match
	 */
	getCookie(name, matchOptions = {}) {
		this._removeExpiredCookies();
		const cookie = this.cookies[name];
		
		if (!cookie) return null;

		// If no match options provided, return the cookie value
		if (Object.keys(matchOptions).length === 0) {
			return cookie.value;
		}

		// Check if all provided options match
		const cookieOptions = cookie.options;
		for (const [key, value] of Object.entries(matchOptions)) {
			if (cookieOptions[key] !== value) {
				return null;
			}
		}

		return cookie.value;
	}

	/**
	 * Remove a cookie from the jar
	 * @param {string} name - Cookie name
	 */
	removeCookie(name) {
		delete this.cookies[name];
	}

	/**
	 * Get all valid cookies
	 * @returns {Object} Object containing all non-expired cookies
	 */
	getAllCookies() {
		this._removeExpiredCookies();
		const result = {};
		for (const [name, cookie] of Object.entries(this.cookies)) {
			result[name] = cookie.value;
		}
		return result;
	}

	/**
	 * Remove expired cookies from the jar
	 * @private
	 */
	_removeExpiredCookies() {
		const now = Date.now();
		for (const [name, cookie] of Object.entries(this.cookies)) {
			if (cookie.options.expires) {
				const expiryTime = cookie.options.expires instanceof Date 
					? cookie.options.expires.getTime() 
					: cookie.options.expires;
				
				if (now > expiryTime) {
					this.removeCookie(name);
				}
			}
		}
	}

	/**
	 * Clear all cookies from the jar
	 */
	clear() {
		this.cookies = {};
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
	var cookieProps = Object.keys(cookieData);
	var serializedCookie = "";

	for (let i = 0; i < cookieProps.length; i++) {
		serializedCookie += encodeURIComponent(cookieProps[i]) + (cookieData[cookieProps[i]] === null ? "" : ("=" + encodeURIComponent(cookieData[cookieProps[i]]) + (i < cookieProps.length - 1 ? ";" : "")));
	}
	
	return serializedCookie;
}

module.exports = {
	parse,
	serialize,
	CookieJar
};