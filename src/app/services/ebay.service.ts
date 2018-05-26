import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'
import { WindowService } from './window.service';

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
  private oAuthScope: [string]

  private isSandBox: boolean = true
  private authenticated: boolean = false
  private token: string
  private expires: any = 0
  private userInfo: any = {}
  private windowHandle: any = null
  private intervalId: any = null
  private expiresTimerId: any = null
  private loopCount = 600
  private intervalLength = 100

  private config: any

  constructor(private _http: HttpClient, private _windows: WindowService) {
    this.config = this._http.get('assets/config.json')
    if (this.isSandBox) {
      this.loadSandboxConfig()
    } else {
      this.loadProductionConfig()
    }
  }

  loadSandboxConfig() {
    this.config
      .subscribe((config: any) => {
        this.oAuthClientId = config.ebaysandbox.client_id
        this.oAuthSecret = config.ebaysandbox.secret
        this.oAuthCallback = config.ebaysandbox.callback
        this.oAuthRuName = config.ebaysandbox.ru_name
        this.oAuthAuthorizeUrl = config.ebaysandbox.authorize_url
        this.oAuthAccessUrl = config.ebaysandbox.access_url
        this.oAuthScope = config.ebaysandbox.scope
      })
  }
  loadProductionConfig() {
    this.config
      .subscribe((config: any) => {
        this.oAuthClientId = config.ebay.client_id
        this.oAuthSecret = config.ebay.secret
        this.oAuthCallback = config.ebay.callback
        this.oAuthRuName = config.ebay.ru_name
        this.oAuthAuthorizeUrl = config.ebay.authorize_url
        this.oAuthAccessUrl = config.ebay.access_url
        this.oAuthScope = config.ebay.scope
      })
  }

  getAccessToken() {
    
  }
}
