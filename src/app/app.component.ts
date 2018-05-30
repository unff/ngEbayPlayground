import { Component } from '@angular/core';
import {EbayService} from "./services/ebay.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(private authService: EbayService) {}

  get authenticated() {
    return this.authService.isAuthenticated();
  }

  doLogin() {
    this.authService.getAccessToken();
  }

  doLogout() {
    this.authService.doLogout();
}

}
