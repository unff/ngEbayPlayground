import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { WebStorageModule } from 'ngx-store';
import {EbayService} from "./services/ebay.service";
import {WindowService} from "./services/window.service";
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { FormsModule } from '@angular/forms';

// import {  } from 'ngx-bootstrap'

//import {Jsonp, Response} from '@angular/http';

import { AppComponent } from './app.component';
import { SidenavComponent } from './sidenav/sidenav.component';

@NgModule({
  declarations: [
    AppComponent,
    SidenavComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    WebStorageModule,
    FormsModule,
    ButtonsModule
  ],
  providers: [
    EbayService,
    WindowService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
