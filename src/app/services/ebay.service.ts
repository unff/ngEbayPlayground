import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'
import { WindowService } from './window.service';
import { CookieStorage, LocalStorage, SessionStorage } from 'ngx-store';

@Injectable({
  providedIn: 'root'
})
export class EbayService {
  private oAuthClientId: string
  private oAuthSecret: string
  private oAuthCallback: string
  private oAuthRuName: string
  private oAuthAuthorizeUrl: string
  private oAuthAccessUrl: string
  private oAuthScope: string
  private timeURL: string
  private sandboxTimeURL: string
  private timeOffset: number // offset between eBayTime and systemTime in ms

  private isSandBox: boolean = true
  @LocalStorage() public accessToken: string
  @LocalStorage() public refreshToken: string
  @LocalStorage() public accessTokenExpiration: number
  @LocalStorage() public refreshTokenExpiration: number
  //@LocalStorage() public sandboxAccessToken: string
  //@LocalStorage() public sandboxRefreshToken: string
  private token: string
  private accessTokenSeconds: number
  private refreshTokenSeconds: number

  private authenticated: boolean = false
  private expires: any = 0
  private userInfo: any = {}
  private windowHandle: any = null
  private intervalId: any = null
  private expiresTimerId: any = null
  private loopCount = 600
  private intervalLength = 100

  private config: any
  private officialEbayTime: any
  private ebayTokens: any
  private locationWatcher = new EventEmitter();  // @TODO: switch to RxJS Subject instead of EventEmitter

  constructor(private _http: HttpClient, private _windows: WindowService) {
    this.config = this._http.get('assets/config.json')
    if (this.isSandBox) {
      //console.log('loadSandboxConfig')
      this.loadSandboxConfig()
    } else {
      this.loadProductionConfig()
    }
    
  }

  private calculateExpiration(totalSeconds: number, type?:string) {
    // add totalSeconds to now(), return type (date, timestamp) default timestamp
    // do I need a time skew from localTime to eBayTime?
    
  }


  public loadSandboxConfig() {
    console.log('sandbox')
    //console.log(this.config)
    this.config.subscribe((config: any)=> {
        //console.log('hello')
        //console.log(config)
        this.oAuthClientId = config.ebaysandbox.client_id
        this.oAuthSecret = config.ebaysandbox.secret
        this.oAuthCallback = config.ebaysandbox.callback
        this.oAuthRuName = config.ebaysandbox.ru_name
        
        this.oAuthAccessUrl = config.ebaysandbox.access_url
        this.oAuthScope = 
                            config.ebaysandbox.scope
                            .reduce((acc, val)=> acc+' '+val)
                            // .trim()
        //console.log('before')
        //console.log(this.oAuthScope)
        this.oAuthScope = encodeURIComponent(this.oAuthScope)
        this.oAuthAuthorizeUrl = config.ebaysandbox.authorize_url
          +"?client_id="+config.ebaysandbox.client_id
          +"&response_type=code"
          +"&redirect_uri="+config.ebaysandbox.ru_name
          +"&scope="+this.oAuthScope
          //console.log('scope: '+this.oAuthScope)
          //console.log('aUrl: '+this.oAuthAuthorizeUrl)
      },
      error => console.log('error',error),
      () => console.log('completed')
    )
      // .unsubscribe()
    // Check for valid refresh token
    // Check for valid access token
  }

  public loadProductionConfig() {
    this.config
      .subscribe((config: any) => {
        this.oAuthClientId = config.ebay.client_id
        this.oAuthSecret = config.ebay.secret
        this.oAuthCallback = config.ebay.callback
        this.oAuthRuName = config.ebay.ru_name
        
        this.oAuthAccessUrl = config.ebay.access_url
        this.oAuthScope = encodeURIComponent(
          config.ebay.scope
          .reduce((acc, val)=> acc+val+' ', '&scope=')
          .trim()
        )
        this.oAuthAuthorizeUrl = config.ebay.authorize_url
          +"?client_id="+config.ebay.client_id
          +"&response_type=code"
          +"&redirect_uri="+config.ebay.ru_name
          +this.oAuthScope
          //console.log('insub: '+this.oAuthAuthorizeUrl)
        this.timeURL = config.ebaysandbox.time_url+this.oAuthClientId
      })
      
    // Check for valid refresh token
    // Check for valid access token
  }

  public getTokens() {
    var loopCount = this.loopCount;
    this.windowHandle = this._windows.createWindow(this.oAuthAuthorizeUrl, 'OAuth2 Login');
    this.intervalId = setInterval(() => {
      if (loopCount-- < 0) {
        clearInterval(this.intervalId);
        this.emitAuthStatus(false);
        this.windowHandle.close();
      } else {
        var href: string;
        try { 
          href = this.windowHandle.location.href;  // this will error out with a cross-origin DOMException error until the redirect brings us back to localhost:3000
        } catch (e) {
          console.log('Error:', e); // output the cross-origin error if you want to see it in the browser console
        }
        if (href != null) {
          var re = /code=(.*)/; // looks for the words "code=" in the href of the auth window
          var found = href.match(re);
          if (found) {
            console.log("Callback URL:", href);
            clearInterval(this.intervalId);
            var parsed = this.parse(href.substr(this.oAuthCallback.length + 1));
            this.token = parsed.code;
            if (this.token) {
              this.windowHandle.close();
              // Get access token and refresh token
              var encodedToken: string = btoa(this.oAuthClientId+":"+this.oAuthSecret)
              var body = "grant_type=authorization_code&code="+this.token+"&redirect_uri="+this.oAuthRuName
              var headers = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
                                             .set('Authorization', 'Basic '+encodedToken)
                                             //.set('Access-Control-Allow-Origin','*')
              // I hate CORS so much some times. Hack around it with a CORS proxy.
              this._http.post("https://cors-anywhere.herokuapp.com/"+this.oAuthAccessUrl,body,{headers: headers})
                .subscribe(res => {
                  this.ebayTokens = res
                  this.accessToken = res['access_token']
                  this.refreshToken = res['refresh_token']
                  this.accessTokenSeconds = res['expires_in']
                  this.refreshTokenSeconds = res['refresh_token_expires_in']
                  // this.accessTokenExpiration = res['a']
                  this.authenticated = true;
                  this.startExpiresTimer(this.accessTokenSeconds);
                  this.expires = new Date().getTime()+(this.accessTokenSeconds*1000);
                  this.refreshTokenExpiration = new Date().getTime()+(this.refreshTokenSeconds*1000)
                  
                })


              this.emitAuthStatus(true);
                
            } else {
              console.log('false')
              this.authenticated = false; // we got the login callback just fine, but there was no token
              this.emitAuthStatus(false); // so we are still going to fail the login
            }

          } else {
            // http://localhost:3000/auth/callback#error=access_denied
            if (href.indexOf(this.oAuthCallback) == 0) {
              clearInterval(this.intervalId);
              var parsed = this.parse(href.substr(this.oAuthCallback.length + 1));
              this.windowHandle.close();
              this.emitAuthStatusError(false, parsed);
            }
          }
        }
      }
    }, this.intervalLength);
  }

  public refreshAccessToken() {

  }

  private startExpiresTimer(seconds: number) {
    if (this.expiresTimerId != null) {
      clearTimeout(this.expiresTimerId);
    }
    this.expiresTimerId = setTimeout(() => {
      console.log('Session has expired');
      this.doLogout();
    }, seconds * 1000); // seconds * 1000
    console.log('Token expiration timer set for', seconds, "seconds");
  }
  
  public doLogout() {
    this.authenticated = false;
    this.expiresTimerId = null;
    this.expires = 0;
    this.token = null;
    this.emitAuthStatus(true);
    console.log('Session has been cleared');
    }

  public subscribe(onNext: (value: any) => void, onThrow?: (exception: any) => void, onReturn?: () => void) {
      return this.locationWatcher.subscribe(onNext, onThrow, onReturn);
  }

  public isAuthenticated() {
      return this.authenticated;
  }

  private emitAuthStatus(success: boolean) {
    this.emitAuthStatusError(success, null);
  }

  private emitAuthStatusError(success: boolean, error: any) {
      this.locationWatcher.emit(
          {
              success: success,
              authenticated: this.authenticated,
              token: this.token,
              expires: this.expires,
              error: error
          }
      );
  }

  private parse(str) { // lifted from https://github.com/sindresorhus/query-string
        if (typeof str !== 'string') {
            return {};
        }
        console.log('str: '+str)
        str = str.trim().replace(/^(\?|#|&)/, ''); // If the string starts with one of these three chars (?#&), remove it.

        if (!str) {
            return {};
        }

        return str.split('&').reduce(function (ret, param) {
            var parts = param.replace(/\+/g, ' ').split('=');
            // Firefox (pre 40) decodes `%3D` to `=`
            // https://github.com/sindresorhus/query-string/pull/37
            var key = parts.shift();
            console.log(key)
            var val = parts.length > 0 ? parts.join('=') : undefined;

            key = decodeURIComponent(key);

            // missing `=` should be `null`:
            // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
            val = val === undefined ? null : decodeURIComponent(val);

            if (!ret.hasOwnProperty(key)) {
                ret[key] = val;
            } else if (Array.isArray(ret[key])) {
                ret[key].push(val);
            } else {
                ret[key] = [ret[key], val];
            }

            return ret;
        }, {});
    };
  
}
