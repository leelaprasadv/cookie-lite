const { test } = require('uvu');
const assert = require('uvu/assert');
const lightcookie = require("..");

test('Parsing cookie with non-ASCII characters', () => {
	const parseCookieResult = lightcookie.parse("foo=bar; equation=E%3Dmc%5E2");
	assert.is(parseCookieResult.equation, "E=mc^2", "Equation should be properly decoded");
});

test('Parsing cookie with special characters', () => {
	const parseCookieResult = lightcookie.parse("copyright=%C2%A9");
	assert.is(parseCookieResult.copyright, "©", "Copyright symbol should be properly decoded");
});

test('Parsing cookie with unusual formatting', () => {
	const parseCookieResult = lightcookie.parse("        foo=bar;        test=hey;");
	assert.is(parseCookieResult.foo, "bar", "Should handle extra whitespace");
});

test('Parsing cookie with properties without values', () => {
	const parseCookieResult = lightcookie.parse("hey=hi;noValue;test=test2");
	assert.is(parseCookieResult.hey, "hi", "Should parse regular key-value pairs");
	assert.is(parseCookieResult.noValue, null, "Should set valueless properties to null");
	assert.is(parseCookieResult.test, "test2", "Should parse subsequent key-value pairs");
});

test('Parsing cookie with spaces in value (Support for older spec)', () => {
	const parseCookieResult = lightcookie.parse("hi=hello there; novalue; hello= ;");
	assert.is(parseCookieResult.hi, "hello there", "Should preserve spaces in values");
	assert.is(parseCookieResult.hello, " ", "Should preserve single space value");
});

test('Serialize cookie', () => {
	const serializeCookieResult = lightcookie.serialize({
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
	const serializeCookieResult = lightcookie.serialize({
		"prop1": "prop2",
		"emptyProp": null
	});
	assert.is(
		serializeCookieResult,
		"prop1=prop2;emptyProp",
		"Should handle null values correctly"
	);
});

test.run();