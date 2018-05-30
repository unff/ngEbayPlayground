ebay service

onInit:
- check localStorage for access token
- Y: get refresh token
- N: get access token, get refresh token, store in localStorage

refreshToken:
- get refresh token from eBay
- create header token and store it in class variable

httpInterceptor here?  or in another service?

Hey the auth window isn't closing, and it's serving up a URL that I dont think it should.

