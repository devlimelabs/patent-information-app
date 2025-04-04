import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';

import { PatentsViewApiClient } from './api-clients/patents-view-api.client';
import { DataIndexingService } from './services/data-indexing.service';
import { DataIntegrationService } from './services/data-integration.service';
import { MeilisearchService } from './services/meilisearch.service';
import { SemanticSearchService } from './services/semantic-search.service';
import { PatentsViewTransformerService } from './transformers/patents-view-transformer.service';
import { PatentValidatorService } from './validators/patent-validator.service';

/**
 * Data Integration Module
 * 
 * Provides services for patent data integration:
 * - API clients for fetching data from patent data sources
 * - Transformers for converting source-specific data to unified model
 * - Validators for ensuring data quality
 * - Loaders for storing data in Firestore
 */
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers: [
    PatentsViewApiClient,
    PatentsViewTransformerService,
    PatentValidatorService,
    DataIntegrationService,
    MeilisearchService,
    SemanticSearchService,
    DataIndexingService
  ],
  exports: []
})
export class DataIntegrationModule { }
