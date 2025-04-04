import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Index, MeiliSearch, SearchResponse } from 'meilisearch';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { Patent } from '../models/patent.model';

/**
 * Meilisearch Service
 * 
 * Handles interaction with the Meilisearch instance for patent data indexing and searching.
 * Provides methods for indexing, searching, and managing patent data in Meilisearch.
 */
@Injectable({
  providedIn: 'root'
})
export class MeilisearchService {
  private client: MeiliSearch;
  private patentIndex: Index;
  private readonly indexName = 'patents';

  constructor(private http: HttpClient) {
    this.client = new MeiliSearch({
      host: environment.meilisearch.host,
      apiKey: environment.meilisearch.apiKey
    });
    this.patentIndex = this.client.index(this.indexName);
  }

  /**
   * Initialize the Meilisearch index with proper settings
   * 
   * @returns Observable of the initialization status
   */
  initializeIndex(): Observable<any> {
    return from(this.client.createIndex(this.indexName, { primaryKey: 'patent_id' }))
      .pipe(
        catchError(error => {
          // Index might already exist, which is fine
          if (error.code === 'index_already_exists') {
            return from(Promise.resolve({ status: 'index_already_exists' }));
          }
          return throwError(() => error);
        }),
        map(() => this.configureIndex())
      );
  }

  /**
   * Configure the Meilisearch index with searchable attributes, filterable attributes, and ranking rules
   * 
   * @returns Promise of the configuration status
   */
  private async configureIndex(): Promise<any> {
    try {
      // Configure searchable attributes
      await this.patentIndex.updateSearchableAttributes([
        'title',
        'abstract',
        'description',
        'claims.text',
        'inventors.name',
        'assignees.name',
        'classifications.code',
        'classifications.description'
      ]);

      // Configure filterable attributes
      await this.patentIndex.updateFilterableAttributes([
        'patent_id',
        'kind_code',
        'dates.filing',
        'dates.publication',
        'dates.grant',
        'inventors.name',
        'inventors.location.country',
        'inventors.location.state',
        'assignees.name',
        'assignees.type',
        'assignees.location.country',
        'classifications.system',
        'classifications.code'
      ]);

      // Configure sortable attributes
      await this.patentIndex.updateSortableAttributes([
        'dates.filing',
        'dates.publication',
        'dates.grant'
      ]);

      // Configure ranking rules
      await this.patentIndex.updateRankingRules([
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness'
      ]);

      // Configure synonyms
      const synonyms = {
        'ai': ['artificial intelligence', 'machine learning', 'neural network'],
        'blockchain': ['distributed ledger', 'crypto'],
        'iot': ['internet of things', 'connected devices'],
        'vr': ['virtual reality'],
        'ar': ['augmented reality']
      };
      await this.patentIndex.updateSynonyms(synonyms);

      return { status: 'index_configured' };
    } catch (error) {
      console.error('Error configuring Meilisearch index:', error);
      throw error;
    }
  }

  /**
   * Index a single patent document in Meilisearch
   * 
   * @param patent The patent document to index
   * @returns Observable of the indexing result
   */
  indexPatent(patent: Patent): Observable<any> {
    return from(this.patentIndex.addDocuments([patent]))
      .pipe(
        catchError(error => {
          console.error('Error indexing patent:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Index multiple patent documents in Meilisearch
   * 
   * @param patents Array of patent documents to index
   * @returns Observable of the indexing result
   */
  indexPatents(patents: Patent[]): Observable<any> {
    return from(this.patentIndex.addDocuments(patents))
      .pipe(
        catchError(error => {
          console.error('Error indexing patents:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Search for patents in Meilisearch
   * 
   * @param query The search query
   * @param options Search options including filters, pagination, etc.
   * @returns Observable of the search results
   */
  searchPatents(
    query: string,
    options: {
      filters?: string,
      limit?: number,
      offset?: number,
      sort?: string[]
    } = {}
  ): Observable<SearchResponse<Patent>> {
    return from(this.patentIndex.search(query, options))
      .pipe(
        catchError(error => {
          console.error('Error searching patents:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get a patent by ID from Meilisearch
   * 
   * @param patentId The patent ID to retrieve
   * @returns Observable of the patent document
   */
  getPatentById(patentId: string): Observable<Patent> {
    return from(this.patentIndex.getDocument(patentId))
      .pipe(
        catchError(error => {
          console.error(`Error getting patent with ID ${patentId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Delete a patent from the Meilisearch index
   * 
   * @param patentId The patent ID to delete
   * @returns Observable of the deletion result
   */
  deletePatent(patentId: string): Observable<any> {
    return from(this.patentIndex.deleteDocument(patentId))
      .pipe(
        catchError(error => {
          console.error(`Error deleting patent with ID ${patentId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get index stats from Meilisearch
   * 
   * @returns Observable of the index stats
   */
  getIndexStats(): Observable<any> {
    return from(this.patentIndex.getStats())
      .pipe(
        catchError(error => {
          console.error('Error getting index stats:', error);
          return throwError(() => error);
        })
      );
  }
}
