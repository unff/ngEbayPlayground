import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { WebStorageModule } from 'ngx-store';

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
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
