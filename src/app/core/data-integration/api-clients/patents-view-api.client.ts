import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';

/**
 * PatentsView API Client
 * 
 * Handles communication with the PatentsView API for fetching US patent data.
 * Implements authentication, request handling, and error management.
 */
@Injectable({
  providedIn: 'root'
})
export class PatentsViewApiClient {
  private apiUrl = environment.patentsView.apiUrl;
  private apiKey = environment.patentsView.apiKey;

  constructor(private http: HttpClient) { }

  /**
   * Get patents based on query parameters
   * 
   * @param query The query object following PatentsView API query syntax
   * @param fields Array of fields to return in the response
   * @param options Additional options like sort, per_page, page
   * @returns Observable with the API response
   */
  getPatents(
    query: any, 
    fields: string[] = ["patent_id", "patent_title", "patent_abstract"], 
    options: { sort?: any[], per_page?: number, page?: number } = {}
  ): Observable<any> {
    const requestBody = {
      q: query,
      f: fields,
      o: options
    };

    return this.makeApiRequest('/patent', requestBody);
  }

  /**
   * Get a single patent by ID
   * 
   * @param patentId The patent ID to retrieve
   * @param fields Array of fields to return in the response
   * @returns Observable with the API response
   */
  getPatentById(patentId: string, fields?: string[]): Observable<any> {
    const query = {
      "_eq": {
        "patent_id": patentId
      }
    };

    return this.getPatents(query, fields);
  }

  /**
   * Get patents by date range
   * 
   * @param startDate Start date in YYYY-MM-DD format
   * @param endDate End date in YYYY-MM-DD format
   * @param fields Array of fields to return in the response
   * @param options Additional options like sort, per_page, page
   * @returns Observable with the API response
   */
  getPatentsByDateRange(
    startDate: string, 
    endDate: string, 
    fields?: string[], 
    options?: { sort?: any[], per_page?: number, page?: number }
  ): Observable<any> {
    const query = {
      "_and": [
        {
          "_gte": {
            "patent_date": startDate
          }
        },
        {
          "_lte": {
            "patent_date": endDate
          }
        }
      ]
    };

    return this.getPatents(query, fields, options);
  }

  /**
   * Get inventors based on query parameters
   * 
   * @param query The query object following PatentsView API query syntax
   * @param fields Array of fields to return in the response
   * @param options Additional options like sort, per_page, page
   * @returns Observable with the API response
   */
  getInventors(
    query: any, 
    fields: string[] = ["inventor_id", "inventor_name", "inventor_city", "inventor_state", "inventor_country"], 
    options: { sort?: any[], per_page?: number, page?: number } = {}
  ): Observable<any> {
    const requestBody = {
      q: query,
      f: fields,
      o: options
    };

    return this.makeApiRequest('/inventor', requestBody);
  }

  /**
   * Get assignees based on query parameters
   * 
   * @param query The query object following PatentsView API query syntax
   * @param fields Array of fields to return in the response
   * @param options Additional options like sort, per_page, page
   * @returns Observable with the API response
   */
  getAssignees(
    query: any, 
    fields: string[] = ["assignee_id", "assignee_name", "assignee_type", "assignee_city", "assignee_state", "assignee_country"], 
    options: { sort?: any[], per_page?: number, page?: number } = {}
  ): Observable<any> {
    const requestBody = {
      q: query,
      f: fields,
      o: options
    };

    return this.makeApiRequest('/assignee', requestBody);
  }

  /**
   * Get CPC classifications based on query parameters
   * 
   * @param query The query object following PatentsView API query syntax
   * @param fields Array of fields to return in the response
   * @param options Additional options like sort, per_page, page
   * @returns Observable with the API response
   */
  getCpcClassifications(
    query: any, 
    fields: string[] = ["cpc_subsection_id", "cpc_subsection_title"], 
    options: { sort?: any[], per_page?: number, page?: number } = {}
  ): Observable<any> {
    const requestBody = {
      q: query,
      f: fields,
      o: options
    };

    return this.makeApiRequest('/cpc_subsection', requestBody);
  }

  /**
   * Make a request to the PatentsView API
   * 
   * @param endpoint API endpoint to call
   * @param body Request body
   * @returns Observable with the API response
   */
  private makeApiRequest(endpoint: string, body: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Api-Key': this.apiKey
    });

    const url = `${this.apiUrl}${endpoint}`;

    return this.http.post(url, body, { headers })
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  /**
   * Error handler for API requests
   * 
   * @param error The HTTP error response
   * @returns An observable with the error message
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      
      // Add more context if available in the error response
      if (error.error && error.error.message) {
        errorMessage += `\nAPI Message: ${error.error.message}`;
      }
    }
    
    console.error('PatentsView API Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
