Two indicators in the top bar:
- AccessToken is still good
- Refresh token is still good

Persist session across tabs (check for access/refresh token in localStorage)
hook into firebase for call history / tokens?
Check ebayofficialtime and generate time offset on startup.





ebay service

onInit:
- check localStorage for access token
- Y: get refresh token
- N: get access token, get refresh token, store in localStorage

refreshToken:
- get refresh token from eBay
- create header token and store it in class variable

httpInterceptor here?  or in another service?

why are all URLs getting processed and pushed to appComponent? -- no routes defined


