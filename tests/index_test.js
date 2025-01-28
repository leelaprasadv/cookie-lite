const { test } = require('uvu');
const assert = require('uvu/assert');
const cookielite = require("..");

test('Parsing cookie with non-ASCII characters', () => {
	const parseCookieResult = cookielite.parse("foo=bar; equation=E%3Dmc%5E2");
	assert.is(parseCookieResult.equation, "E=mc^2", "Equation should be properly decoded");
});

test('Parsing cookie with special characters', () => {
	const parseCookieResult = cookielite.parse("copyright=%C2%A9");
	assert.is(parseCookieResult.copyright, "©", "Copyright symbol should be properly decoded");
});

test('Parsing cookie with unusual formatting', () => {
	const parseCookieResult = cookielite.parse("        foo=bar;        test=hey;");
	assert.is(parseCookieResult.foo, "bar", "Should handle extra whitespace");
});

test('Parsing cookie with properties without values', () => {
	const parseCookieResult = cookielite.parse("hey=hi;noValue;test=test2");
	assert.is(parseCookieResult.hey, "hi", "Should parse regular key-value pairs");
	assert.is(parseCookieResult.noValue, null, "Should set valueless properties to null");
	assert.is(parseCookieResult.test, "test2", "Should parse subsequent key-value pairs");
});

test('Parsing cookie with spaces in value (Support for older spec)', () => {
	const parseCookieResult = cookielite.parse("hi=hello there; novalue; hello= ;");
	assert.is(parseCookieResult.hi, "hello there", "Should preserve spaces in values");
	assert.is(parseCookieResult.hello, " ", "Should preserve single space value");
});

test('Serialize cookie', () => {
	const serializeCookieResult = cookielite.serialize({
		"prop1": "prop2",
		"copyright": "©"
	});
	assert.is(
		serializeCookieResult,
		"prop1=prop2;copyright=%C2%A9",
		"Should properly serialize and encode special characters"
	);
});

test('Serialize cookie property with no value', () => {
	const serializeCookieResult = cookielite.serialize({
		"prop1": "prop2",
		"emptyProp": null
	});
	assert.is(
		serializeCookieResult,
		"prop1=prop2;emptyProp",
		"Should handle null values correctly"
	);
});

test('CookieJar - Store and retrieve cookies', () => {
	const jar = new cookielite.CookieJar();
	jar.setCookie('session=abc123', 'example.com');
	jar.setCookie('user=john', 'example.com');
	
	const cookies = jar.getCookies('example.com');
	assert.equal(cookies, {
		session: 'abc123',
		user: 'john'
	}, "Should correctly store and retrieve cookies");
});

test('CookieJar - Domain matching', () => {
	const jar = new cookielite.CookieJar();
	jar.setCookie('session=abc123', 'example.com');
	jar.setCookie('user=john', 'sub.example.com');
	
	const mainDomainCookies = jar.getCookies('example.com');
	assert.equal(mainDomainCookies, {
		session: 'abc123'
	}, "Should only return cookies for exact domain match");
	
	const subDomainCookies = jar.getCookies('sub.example.com');
	assert.equal(subDomainCookies, {
		user: 'john'
	}, "Should only return cookies for exact subdomain match");
});

test('CookieJar - Path handling', () => {
	const jar = new cookielite.CookieJar();
	jar.setCookie('session=abc123', 'example.com', '/');
	jar.setCookie('auth=token123', 'example.com', '/api');
	
	const rootCookies = jar.getCookies('example.com', '/');
	assert.equal(rootCookies, {
		session: 'abc123'
	}, "Should return cookies for root path");
	
	const apiCookies = jar.getCookies('example.com', '/api');
	assert.equal(apiCookies, {
		session: 'abc123',
		auth: 'token123'
	}, "Should return both root and path-specific cookies");
});

test('CookieJar - Clear cookies', () => {
	const jar = new cookielite.CookieJar();
	jar.setCookie('session=abc123', 'example.com');
	jar.setCookie('user=john', 'example.com');
	
	jar.clearCookies('example.com');
	const cookies = jar.getCookies('example.com');
	assert.equal(cookies, {}, "Should clear all cookies for the domain");
});

test('CookieJar - Expired cookies', () => {
	const jar = new cookielite.CookieJar();
	const pastDate = new Date(Date.now() - 1000).toUTCString();
	const futureDate = new Date(Date.now() + 1000000).toUTCString();
	
	jar.setCookie(`expired=old; Expires=${pastDate}`, 'example.com');
	jar.setCookie(`valid=new; Expires=${futureDate}`, 'example.com');
	
	const cookies = jar.getCookies('example.com');
	assert.equal(cookies, {
		valid: 'new'
	}, "Should only return non-expired cookies");
});

test.run();