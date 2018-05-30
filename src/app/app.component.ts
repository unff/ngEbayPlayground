import { Component } from '@angular/core';
import {EbayService} from "./services/ebay.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title="App works"
  constructor(private authService: EbayService) {}

  get authenticated() {
    return this.authService.isAuthenticated();
  }

  doLogin() {
    this.authService.getAuthToken();
  }

  doLogout() {
    this.authService.doLogout();
  }
  getAccessToken() {
    return this.authService.accessToken
  }

}
