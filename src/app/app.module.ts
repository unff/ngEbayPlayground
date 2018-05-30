import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { WebStorageModule } from 'ngx-store';
import {EbayService} from "./services/ebay.service";
import {WindowService} from "./services/window.service";

//import {Jsonp, Response} from '@angular/http';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    WebStorageModule
  ],
  providers: [
    EbayService,
    WindowService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
