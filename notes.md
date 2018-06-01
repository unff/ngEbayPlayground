Two indicators in the top bar:
- AccessToken is still good
- Refresh token is still good

Persist session across tabs (check for access/refresh token in localStorage)
hook into firebase for call history / tokens?
NOPE (http only call): Check ebayofficialtime and generate time offset on startup. 
Ability to swap from sandbox to production via a click
- DONE: set/get functions to return tokens based on isSandBox
- two buttons in navbar, active one glows but is disabled
Ability to swap from US to UK to AU with a selection






ebay service

onInit: (NOPE, not in a service)
constructor:
- check localStorage for refresh token expiration > new Date()
- Y: get access token, set isAuthorized = true
- N: set isAuthorized = false

on sandbox/prod swap:
- check for 

refreshToken:
- get refresh token from eBay
- create header token and store it in class variable

httpInterceptor here?  or in another service?

why are all URLs getting processed and pushed to appComponent? -- no routes defined


