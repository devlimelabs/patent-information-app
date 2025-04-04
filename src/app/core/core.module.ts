import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';

import { DataIntegrationModule } from './data-integration/data-integration.module';

/**
 * Core Module
 * 
 * Provides application-wide singleton services and configuration.
 * This module should be imported only in the AppModule.
 */
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule,
    DataIntegrationModule
  ],
  providers: []
})
export class CoreModule { }
