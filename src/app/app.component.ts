import { Component, OnInit, OnChanges, DoCheck } from '@angular/core';
import {EbayService} from "./services/ebay.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, DoCheck {
  envModel = this.authService.isSandbox ? 'Sandbox' : 'Production'
  
  constructor(private authService: EbayService) {}

  get authenticated() {
    return this.authService.isAuthenticated();
  }
  
  ngOnInit() {
    console.log('appComponent onInit')

  }

  ngDoCheck() {
    console.log('appComponent doCheck ')
    console.log('configsLoaded: '+this.authService.configsLoaded)
  }

  doLogin() {
    this.authService.getTokens();
  }

  doLogout() {
    this.authService.doLogout();
  }
  getAccessToken() {
    return this.authService.accessToken
  }
  getAccessSeconds() {

  }
  getRefreshToken() {
    return this.authService.refreshToken
  }

  getSite() {
    return this.authService.isSandbox?'sandbox':'production'
  }

  d(d:Date){return new Date(d)}

}
