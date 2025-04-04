import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { Patent } from '../models/patent.model';
import { MeilisearchService } from './meilisearch.service';

/**
 * Semantic Search Service
 * 
 * Provides semantic search capabilities for patent data by combining
 * Meilisearch with Google Vertex AI for enhanced query understanding.
 */
@Injectable({
  providedIn: 'root'
})
export class SemanticSearchService {
  private vertexAiEnabled = false;
  private vertexAiEndpoint = '';
  private vertexAiApiKey = '';

  constructor(
    private meilisearchService: MeilisearchService,
    private http: HttpClient
  ) {
    // Check if Vertex AI is configured and enabled in the environment
    if (environment.vertexAi?.enabled && environment.vertexAi?.apiKey && environment.vertexAi?.endpoint) {
      this.vertexAiEnabled = true;
      this.vertexAiEndpoint = environment.vertexAi.endpoint;
      this.vertexAiApiKey = environment.vertexAi.apiKey;
    }
  }

  /**
   * Perform a semantic search for patents
   * 
   * @param query The user's search query
   * @param filters Search filters (patent type, date range, etc.)
   * @param options Additional search options (pagination, sorting)
   * @returns Observable of search results
   */
  searchPatents(
    query: string,
    filters: {
      patentType?: string,
      dateRange?: string,
      inventor?: string,
      assignee?: string,
      startDate?: string,
      endDate?: string,
      classifications?: string[]
    } = {},
    options: {
      limit?: number,
      offset?: number,
      sort?: string[]
    } = {}
  ): Observable<any> {
    // If query is empty, return empty results
    if (!query.trim()) {
      return of({
        hits: [],
        estimatedTotalHits: 0,
        query: '',
        processingTimeMs: 0,
        limit: options.limit || 20,
        offset: options.offset || 0
      });
    }

    // If Vertex AI is enabled, enhance the query first
    if (this.vertexAiEnabled) {
      return this.enhanceQueryWithVertexAi(query).pipe(
        switchMap(enhancedQuery => this.performMeilisearchQuery(enhancedQuery, filters, options)),
        catchError(error => {
          console.error('Error in semantic search with Vertex AI:', error);
          // Fallback to regular search if Vertex AI fails
          return this.performMeilisearchQuery(query, filters, options);
        })
      );
    } else {
      // Perform regular search without semantic enhancement
      return this.performMeilisearchQuery(query, filters, options);
    }
  }

  /**
   * Enhance a search query using Google Vertex AI
   * 
   * @param query The original search query
   * @returns Observable of the enhanced query
   */
  private enhanceQueryWithVertexAi(query: string): Observable<string> {
    if (!this.vertexAiEnabled) {
      return of(query);
    }

    const requestBody = {
      instances: [
        {
          content: query,
          mimeType: 'text/plain'
        }
      ],
      parameters: {
        temperature: 0.2,
        maxOutputTokens: 256,
        topK: 40,
        topP: 0.95
      }
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.vertexAiApiKey}`
    };

    return this.http.post<any>(this.vertexAiEndpoint, requestBody, { headers }).pipe(
      map(response => {
        // Extract the enhanced query from the Vertex AI response
        // This structure may need to be adjusted based on the actual Vertex AI response format
        if (response.predictions && response.predictions.length > 0) {
          return response.predictions[0].content || query;
        }
        return query;
      }),
      catchError(error => {
        console.error('Error enhancing query with Vertex AI:', error);
        return of(query); // Return original query on error
      })
    );
  }

  /**
   * Perform the actual search query using Meilisearch
   * 
   * @param query The search query (possibly enhanced)
   * @param filters Search filters
   * @param options Search options
   * @returns Observable of search results
   */
  private performMeilisearchQuery(
    query: string,
    filters: any,
    options: any
  ): Observable<any> {
    // Build filter string for Meilisearch
    const filterStrings: string[] = [];

    if (filters.patentType) {
      filterStrings.push(`kind_code = "${filters.patentType}"`);
    }

    if (filters.inventor) {
      filterStrings.push(`inventors.name CONTAINS "${filters.inventor}"`);
    }

    if (filters.assignee) {
      filterStrings.push(`assignees.name CONTAINS "${filters.assignee}"`);
    }

    // Handle date range filters
    if (filters.startDate && filters.endDate) {
      filterStrings.push(`dates.filing >= ${new Date(filters.startDate).getTime()}`);
      filterStrings.push(`dates.filing <= ${new Date(filters.endDate).getTime()}`);
    } else if (filters.dateRange) {
      const now = new Date();
      let startDate: Date;

      switch (filters.dateRange) {
        case 'Last year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        case 'Last 5 years':
          startDate = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
          break;
        case 'Last 10 years':
          startDate = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
          break;
        default:
          startDate = new Date(1790, 0, 1); // First US patent was issued in 1790
      }

      filterStrings.push(`dates.filing >= ${startDate.getTime()}`);
      filterStrings.push(`dates.filing <= ${now.getTime()}`);
    }

    // Handle classification filters
    if (filters.classifications && filters.classifications.length > 0) {
      const classFilters = filters.classifications.map(
        (code: string) => `classifications.code = "${code}"`
      );
      filterStrings.push(`(${classFilters.join(' OR ')})`);
    }

    // Combine all filters with AND
    const filterString = filterStrings.length > 0 ? filterStrings.join(' AND ') : '';

    // Set up search options
    const searchOptions = {
      filters: filterString,
      limit: options.limit || 20,
      offset: options.offset || 0,
      sort: options.sort || []
    };

    // Perform the search
    return this.meilisearchService.searchPatents(query, searchOptions);
  }

  /**
   * Get a patent by ID
   * 
   * @param patentId The patent ID to retrieve
   * @returns Observable of the patent document
   */
  getPatentById(patentId: string): Observable<Patent> {
    return this.meilisearchService.getPatentById(patentId);
  }

  /**
   * Find similar patents based on a reference patent
   * 
   * @param patentId The reference patent ID
   * @param limit Maximum number of similar patents to return
   * @returns Observable of similar patents
   */
  findSimilarPatents(patentId: string, limit: number = 5): Observable<Patent[]> {
    return this.getPatentById(patentId).pipe(
      switchMap(patent => {
        // Create a query from the patent title and abstract
        const query = `${patent.title} ${patent.abstract}`;
        
        // Search for similar patents, excluding the reference patent
        return this.searchPatents(query, {}, { limit: limit + 1 }).pipe(
          map(results => {
            // Filter out the reference patent and limit results
            return results.hits
              .filter((hit: Patent) => hit.patent_id !== patentId)
              .slice(0, limit);
          })
        );
      }),
      catchError(error => {
        console.error(`Error finding similar patents for ${patentId}:`, error);
        return throwError(() => error);
      })
    );
  }
}
