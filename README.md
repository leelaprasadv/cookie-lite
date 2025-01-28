<p align="center" style="text-align: center;"><img src="./docs/public/banner.svg" width="300" alt="cookie-lite logo"/></p>
Super lightweight cookie parser and serializer


---
> Friendly fork of ethan7g/lightcookie post it's deprecation https://github.com/ethan7g/lightcookie/issues/3

> Super lightweight cookie parser and serializer

[Full documentation](https://github.com/leelaprasadv/cookie-lite) | [GitHub](https://github.com/leelaprasadv/cookie-lite) | [NPM](https://www.npmjs.com/package/cookie-lite)

## Installation

```shell
npm i --save cookie-lite
```

## Parsing cookie strings

```javascript
const cookieLite = require('cookie-lite')

cookieLite.parse('foo=bar; copyright=%C2%A9;another=test') // {foo: 'bar', copyright: '©', another: 'test'}
```

## Serializing objects to cookie strings

```javascript
cookieLite.serialize({
	name: 'Choco',
	'HttpOnly': null
}) // 'name=Choco;HttpOnly'
```

## CookieJar Usage

```javascript
const { CookieJar } = require('cookie-lite');

const jar = new CookieJar();

// Set a cookie with options
jar.setCookie('sessionId', '123456', {
	expires: new Date(Date.now() + 3600000), // 1 hour
	path: '/api',
	secure: true,
	httpOnly: true
});

// Get a cookie
const cookie = jar.getCookie('sessionId');

// Get cookie with specific options
const secureApiCookie = jar.getCookie('sessionId', {
	path: '/api',
	secure: true
});

// Remove a cookie
jar.removeCookie('sessionId');

// Get all cookies
const allCookies = jar.getAllCookies();

// Clear all cookies
jar.clear();
```

## PactumJS Integration

cookie-lite includes built-in support for PactumJS, making it easy to handle cookies in your API tests.

### Setting up PactumJS Integration

1. Create a `pactum-cookie-handler.js`:

```javascript
const { handler } = require('pactum').request;
const { CookieJar } = require('cookie-lite');

class PactumCookieHandler {
	constructor() {
		this.jar = new CookieJar();
	}

	onResponse(response) {
		const setCookieHeader = response.headers['set-cookie'];
		if (!setCookieHeader) return;

		const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
		
		cookies.forEach(cookieStr => {
			const [mainPart, ...optionParts] = cookieStr.split(';');
			const [name, value] = mainPart.trim().split('=');
			
			const options = {};
			
			optionParts.forEach(part => {
				const [key, val] = part.trim().split('=');
				switch(key.toLowerCase()) {
					case 'expires':
						options.expires = new Date(val);
						break;
					case 'path':
						options.path = val;
						break;
					case 'domain':
						options.domain = val;
						break;
					case 'secure':
						options.secure = true;
						break;
					case 'httponly':
						options.httpOnly = true;
						break;
				}
			});

			this.jar.setCookie(name, value, options);
		});
	}

	onRequest(request) {
		const cookies = this.jar.getAllCookies();
		if (Object.keys(cookies).length === 0) return;

		const cookieHeader = Object.entries(cookies)
			.map(([name, value]) => `${name}=${value}`)
			.join('; ');

		if (!request.headers) {
			request.headers = {};
		}
		request.headers['Cookie'] = cookieHeader;
	}

	clear() {
		this.jar.clear();
	}
}

const cookieHandler = new PactumCookieHandler();
handler.addCookieHandler(cookieHandler);

module.exports = cookieHandler;
```

2. Use in your tests:

```javascript
const pactum = require('pactum');
const cookieHandler = require('./pactum-cookie-handler');

describe('API Tests with Cookie Support', () => {
	beforeEach(() => {
		// Clear cookies before each test
		cookieHandler.clear();
	});

	it('should handle cookies in requests', async () => {
		// Login request that sets cookies
		await pactum.spec()
			.post('http://api.example.com/login')
			.withJson({
				username: 'test',
				password: 'test123'
			})
			.expectStatus(200);

		// Subsequent request will automatically include cookies
		await pactum.spec()
			.get('http://api.example.com/protected-resource')
			.expectStatus(200);
	});
});
```

## Why cookie-lite?

cookie-lite is super lightweight. It's over much more lightweight than cookie, another popular cookie package. cookie-lite is the way to go for efficiency as it parses using JS regular expressions!

The addition of CookieJar and PactumJS integration makes it even more powerful while maintaining its lightweight nature.



