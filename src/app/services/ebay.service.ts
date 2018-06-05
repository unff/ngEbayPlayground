import { Injectable, EventEmitter } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable, Subscription, Observer } from 'rxjs'
import { map } from 'rxjs/operators'
import { WindowService } from './window.service'
import { CookieStorage, LocalStorage, SessionStorage } from 'ngx-store'
import { Config } from '../config'

@Injectable({
  providedIn: 'root'
})
export class EbayService {
  
  private productionConfig: Config
  private sandboxConfig: Config

  private corsProxy: string = "https://cors-anywhere.herokuapp.com/"
  public get runningConfig(): Config {
    return this.isSandbox? this.sandboxConfig : this.productionConfig
  }
  // public set runningConfig(c: Config) {
  //   if(this.isSandbox) {
  //     this.sandboxConfig = c
  //   } else {
  //     this.productionConfig = c
  //   }
  // }

  // private oAuthClientId: string
  // private oAuthSecret: string
  // private oAuthCallback: string
  // private oAuthRuName: string
  // private oAuthAuthorizeUrl: string
  // private oAuthAccessUrl: string
  // private oAuthScope: string
  // private timeURL: string
  // private sandboxTimeURL: string
  // private timeOffset: number // offset between eBayTime and systemTime in ms
  
  @LocalStorage() public siteModel: string

  @LocalStorage() private _sandboxAccessToken: string
  @LocalStorage() private _sandboxRefreshToken: string
  @LocalStorage() private _sandboxAccessTokenExp: Date
  @LocalStorage() private _sandboxRefreshTokenExp: Date
  
  @LocalStorage() private _productionAccessToken: string
  @LocalStorage() private _productionRefreshToken: string
  @LocalStorage() private _productionAccessTokenExp: Date
  @LocalStorage() private _productionRefreshTokenExp: Date

  @LocalStorage() private _isSandbox: boolean

  
  
  // getters and setters for tokens and expirations
  // private _authenticated: boolean
  public get authenticated(): boolean {
    if (this.refreshTokenExp) {
      return new Date(this.refreshTokenExp).getTime() > new Date().getTime() ? true : false
    } else {
      return false
    }
  }

  public get accessToken(): string {
    return this.isSandbox? this._sandboxAccessToken : this._productionAccessToken
  }
  public set accessToken(token: string) {
    if(this.isSandbox) {
      this._sandboxAccessToken = token
    } else {
      this._productionAccessToken = token
    }
  }

  public get refreshToken(): string {
    return this.isSandbox? this._sandboxRefreshToken : this._productionRefreshToken
  }
  public set refreshToken(token: string) {
    if(this.isSandbox) {
      this._sandboxRefreshToken = token
    } else {
      this._productionRefreshToken = token
    }
  }

  public get accessTokenExp(): Date {
    return this.isSandbox? this._sandboxAccessTokenExp : this._productionAccessTokenExp
  }
  public set accessTokenExp(d: Date) {
    if(this.isSandbox) {
      this._sandboxAccessTokenExp = d
    } else {
      this._productionAccessTokenExp = d
    }
  }

  public get refreshTokenExp(): Date {
    return this.isSandbox? this._sandboxRefreshTokenExp : this._productionRefreshTokenExp
  }
  public set refreshTokenExp(d: Date) {
    if(this.isSandbox) {
      this._sandboxRefreshTokenExp = d
    } else {
      this._productionRefreshTokenExp = d
    }
  }

  public get isSandbox() {
    return this._isSandbox
  }
  public set isSandbox(b: boolean) {
    console.info('isSandbox set to: '+b.toString())
    this._isSandbox = b
  }


  private token: string
  private accessTokenSeconds: number
  private refreshTokenSeconds: number

  // private userInfo: any = {}
  private windowHandle: any = null
  private intervalId: any = null
  private sandboxExpiresTimerId: any = null
  private productionExpiresTimerId: any = null
  private loopCount = 600
  private intervalLength = 100

  private config: Observable<Object>
  public configsLoaded: boolean
  // private officialEbayTime: any
  private ebayTokens: any
  private locationWatcher = new EventEmitter();  // @TODO: switch to RxJS Subject instead of EventEmitter

  constructor(private _http: HttpClient, private _windows: WindowService) {
    this.configsLoaded = false
    this.config = this._http.get('assets/config.json')
    this.config.subscribe((res: any) => {
      this.productionConfig = res.ebay
      this.sandboxConfig = res.ebaysandbox
      this.refreshSandboxAccessToken()
      this.refreshProductionAccessToken()
      this.configsLoaded = true
    })

    if (this.isSandbox == null) {
      console.log('isSandBox defaulting to true')
      //first run (null variable) defaults to Sandbox
      this.isSandbox = true
      this.siteModel = 'EBAY_US'
    } else { // we've been here before.  load previous values and set token expirations.
      // weeeeird @LocalStorage issue where var doesnt register a value on until set?.  WTF.
      this.isSandbox = this.isSandbox
      this.siteModel = this.siteModel
      this._sandboxAccessToken = this._sandboxAccessToken
      this._sandboxRefreshToken = this._sandboxRefreshToken
      this._sandboxAccessTokenExp = this._sandboxAccessTokenExp
      this._sandboxRefreshTokenExp = this._sandboxRefreshTokenExp
      this._productionAccessToken =  this._productionAccessToken
      this._productionRefreshToken =  this._productionRefreshToken
      this._productionAccessTokenExp = this._productionAccessTokenExp
      this._productionRefreshTokenExp = this._productionRefreshTokenExp
      if (new Date(this._sandboxAccessTokenExp).getTime() > new Date().getTime()){
        this.startSandboxTimer(Math.floor((new Date(this._sandboxAccessTokenExp).getTime() - new Date().getTime()) /1000))
      }
      if (new Date(this._productionAccessTokenExp).getTime() > new Date().getTime()){
        this.startProductionTimer(Math.floor((new Date(this._productionAccessTokenExp).getTime() - new Date().getTime()) /1000))
      }
    }
  }

  public toggleEnv() {
    this.isSandbox = !this.isSandbox
  }

  public swapEnv(b: boolean) {
    this.isSandbox = b
  }

  private fullAuthUrl() {
    let scope = encodeURIComponent(
              this.runningConfig.scope
              .reduce((acc, val)=> acc+' '+val)
              //.trim()
            )
    return  this.runningConfig.authorizeUrl
          +"?client_id="+this.runningConfig.clientId
          +"&response_type=code"
          +"&redirect_uri="+this.runningConfig.ruName
          +"&scope="+scope
  }
  
  // public loadSandboxConfig() {
  //   console.log('sandbox')
  //   //console.log(this.config)
  //   this.config.subscribe((config: any)=> {
  //       //console.log('hello')
  //       //console.log(config)
  //       this.oAuthClientId = config.ebaysandbox.clientId
  //       this.oAuthSecret = config.ebaysandbox.secret
  //       this.oAuthCallback = config.ebaysandbox.callback
  //       this.oAuthRuName = config.ebaysandbox.ruName
        
  //       this.oAuthAccessUrl = config.ebaysandbox.accessUrl
  //       this.oAuthScope = config.ebaysandbox.scope
  //                         .reduce((acc, val)=> acc+' '+val)
  //                         // .trim()
  //       //console.log('before')
  //       //console.log(this.oAuthScope)
  //       this.oAuthScope = encodeURIComponent(this.oAuthScope)
  //       this.oAuthAuthorizeUrl = config.ebaysandbox.authorizeUrl
  //         +"?client_id="+config.ebaysandbox.clientId
  //         +"&response_type=code"
  //         +"&redirect_uri="+config.ebaysandbox.ruName
  //         +"&scope="+this.oAuthScope
  //         //console.log('scope: '+this.oAuthScope)
  //         //console.log('aUrl: '+this.oAuthAuthorizeUrl)
  //     },
  //     error => console.log('error',error),
  //     () => console.log('completed')
  //   )
  //     // .unsubscribe()
  //   // Check for valid refresh token
  //   // Check for valid access token
  // }


  

  public getTokens() {
    let loopCount = this.loopCount
    this.windowHandle = this._windows.createWindow(this.fullAuthUrl(), 'OAuth2 Login')
    this.intervalId = setInterval(() => {
      if (loopCount-- < 0) {
        clearInterval(this.intervalId)
        this.emitAuthStatus(false)
        this.windowHandle.close()
      } else {
        let href: string
        try { 
          href = this.windowHandle.location.href;  // this will error out with a cross-origin DOMException error until the redirect brings us back to localhost:3000
        } catch (e) {
          console.log('Error:', e); // output the cross-origin error if you want to see progress in the browser console
        }
        if (href != null) {
          let re = /code=(.*)/; // looks for the words "code=" in the href of the auth window
          let found = href.match(re)
          if (found) {
            console.log("Callback URL:", href)
            clearInterval(this.intervalId)
            let parsed = this.parse(href.substr(this.runningConfig.callback.length + 1))
            this.token = parsed.code
            if (this.token) {
              this.windowHandle.close()
              // Get access token and refresh token
              let encodedToken: string = btoa(this.runningConfig.clientId+":"+this.runningConfig.secret)
              let body = "grant_type=authorization_code&code="+this.token+"&redirect_uri="+this.runningConfig.ruName
              let headers = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
                                             .set('Authorization', 'Basic '+encodedToken)
                                            //  .set('Access-Control-Allow-Origin','*')
                                            //  .set('Access-Control-Allow-Headers','X-Requested-With, Origin, Content-Type, X-Auth-Token')
                                            //  .set('Access-Control-Allow-Methods','GET, PUT, POST, DELETE')
              // I hate CORS so much some times. Hack around it with a CORS proxy.
              this._http.post(this.corsProxy+this.runningConfig.accessUrl,body,{headers: headers})
                .subscribe(res => {
                  this.ebayTokens = res
                  this.accessToken = res['access_token']
                  this.refreshToken = res['refresh_token']
                  this.accessTokenSeconds = res['expires_in']
                  this.refreshTokenSeconds = res['refresh_token_expires_in']
                  this.refreshTokenExp = new Date(Date.now()+(this.refreshTokenSeconds*1000))
                  this.accessTokenExp= new Date(Date.now()+(this.accessTokenSeconds*1000))
                })
              this.emitAuthStatus(true)
                
            } else {
              console.log('false')
              //this.authenticated = false; // we got the login callback just fine, but there was no token
              this.emitAuthStatus(false); // so we are still going to fail the login
            }

          } else {
            // http://localhost:3000/auth/callback#error=access_denied
            if (href.indexOf(this.runningConfig.callback) == 0) {
              clearInterval(this.intervalId)
              let parsed = this.parse(href.substr(this.runningConfig.callback.length + 1))
              this.windowHandle.close()
              this.emitAuthStatusError(false, parsed)
            }
          }
        }
      }
    }, this.intervalLength)
  }
  /// AUGH. Have to refresh these from separate calls
  public refreshSandboxAccessToken() {
    if (new Date(this._sandboxAccessTokenExp).getTime() - 45000 > new Date().getTime()) {
      return false
    }
    // use refresh token to get a new access token
    console.log('refreshing sandbox access token')
    let scope = encodeURIComponent(
      this.sandboxConfig.scope
      .reduce((acc, val)=> acc+' '+val)
      //.trim()
    )
    let encodedToken: string = btoa(this.sandboxConfig.clientId+":"+this.sandboxConfig.secret)
    let body = "grant_type=refresh_token&refresh_token="+this._sandboxRefreshToken+"&scope="+scope
    let headers = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
                                    .set('Authorization', 'Basic '+encodedToken)
    this._http.post(this.corsProxy+this.sandboxConfig.accessUrl,body,{headers: headers})
      .subscribe(res => {
        console.log('sandbox token response received')
        console.log(res)
        this._sandboxAccessToken = res['access_token']
        this._sandboxAccessTokenExp= new Date(Date.now()+(res['expires_in']*1000))
        console.log(res['access_token'] == this._sandboxAccessToken)
        this.startSandboxTimer(res['expires_in'])
      })
  }

  public refreshProductionAccessToken() {
    if (new Date(this._productionAccessTokenExp).getTime() - 45000 > new Date().getTime()) {
      return false
    }
    // use refresh token to get a new access token
    console.log('refreshing production access token')
    let scope = encodeURIComponent(
      this.productionConfig.scope
      .reduce((acc, val)=> acc+' '+val)
      //.trim()
    )
    let encodedToken: string = btoa(this.productionConfig.clientId+":"+this.productionConfig.secret)
    let body = "grant_type=refresh_token&refresh_token="+this._productionRefreshToken+"&scope="+scope
    let headers = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
                                    .set('Authorization', 'Basic '+encodedToken)
    this._http.post(this.corsProxy+this.productionConfig.accessUrl,body,{headers: headers})
      .subscribe(res => {
        console.log('production token response received')
        console.log(res)
        this._productionAccessToken = res['access_token']
        this._productionAccessTokenExp= new Date(Date.now()+(res['expires_in']*1000))
        this.startProductionTimer(res['expires_in'])
      })
  }

  private startSandboxTimer(seconds: number) {
    seconds -= 30 //give a little leeway
    if (this.sandboxExpiresTimerId != null) {
      clearTimeout(this.sandboxExpiresTimerId)
    }
    this.sandboxExpiresTimerId = setTimeout(() => {
      console.log('Session has expired')
      this.refreshSandboxAccessToken()
    }, seconds * 1000);
    console.log('Sandbox token expiration timer set for', seconds, "seconds")
  }

  private startProductionTimer(seconds: number) {
    seconds -= 30 //give a little leeway
    if (this.productionExpiresTimerId != null) {
      clearTimeout(this.productionExpiresTimerId)
    }
    this.productionExpiresTimerId = setTimeout(() => {
      console.log('Session has expired')
      this.refreshProductionAccessToken()
    }, seconds * 1000); 
    console.log('Production token expiration timer set for', seconds, "seconds")
  }
  
  public doLogout() {
    this.sandboxExpiresTimerId = null
    this.productionExpiresTimerId = null
    this.accessTokenSeconds = 0
    this.token = null
    this.emitAuthStatus(true)
    console.log('Session has been cleared')
  }

  public subscribe(onNext: (value: any) => void, onThrow?: (exception: any) => void, onReturn?: () => void) {
    return this.locationWatcher.subscribe(onNext, onThrow, onReturn)
  }

  public isAuthenticated() {
    // refresh token good?
    return this.authenticated
  }

  private emitAuthStatus(success: boolean) {
    this.emitAuthStatusError(success, null)
  }

  private emitAuthStatusError(success: boolean, error: any) {
    this.locationWatcher.emit(
      {
        success: success,
        authenticated: this.isAuthenticated(),
        refreshTokenExpires: this.refreshTokenExp,
        acessTokenExpires: this.accessTokenExp,
        error: error
      }
    )
  }

  private parse(str) { // lifted from https://github.com/sindresorhus/query-string
    if (typeof str !== 'string') {
      return {}
    }
    console.log('str: '+str)
    str = str.trim().replace(/^(\?|#|&)/, ''); // If the string starts with one of these three chars (?#&), remove it.

    if (!str) {
      return {}
    }

    return str.split('&').reduce(function (ret, param) {
      let parts = param.replace(/\+/g, ' ').split('=')
      // Firefox (pre 40) decodes `%3D` to `=`
      // https://github.com/sindresorhus/query-string/pull/37
      let key = parts.shift()
      console.log(key)
      let val = parts.length > 0 ? parts.join('=') : undefined

      key = decodeURIComponent(key)

      // missing `=` should be `null`:
      // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
      val = val === undefined ? null : decodeURIComponent(val)

      if (!ret.hasOwnProperty(key)) {
        ret[key] = val
      } else if (Array.isArray(ret[key])) {
        ret[key].push(val)
      } else {
        ret[key] = [ret[key], val]
      }

      return ret
    }, {})
  }
}
