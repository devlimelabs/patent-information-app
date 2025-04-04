import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { collection, doc, Firestore, getDoc, setDoc, writeBatch } from '@angular/fire/firestore';
import { forkJoin, from, Observable, of, throwError } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';

import { PatentsViewApiClient } from '../api-clients/patents-view-api.client';
import { Patent } from '../models/patent.model';
import { PatentsViewTransformerService } from '../transformers/patents-view-transformer.service';
import { PatentValidatorService } from '../validators/patent-validator.service';

/**
 * Data Integration Service
 * 
 * Orchestrates the entire data integration process for patent data:
 * 1. Fetching data from APIs
 * 2. Transforming data to unified model
 * 3. Validating data quality
 * 4. Loading data into Firestore
 */
@Injectable({
  providedIn: 'root'
})
export class DataIntegrationService {
  private readonly PATENTS_COLLECTION = 'patents';
  private readonly BATCH_SIZE = 500; // Maximum batch size for Firestore

  constructor(
    private http: HttpClient,
    private firestore: Firestore,
    private patentsViewApiClient: PatentsViewApiClient,
    private patentsViewTransformer: PatentsViewTransformerService,
    private patentValidator: PatentValidatorService
  ) { }

  /**
   * Fetch, transform, validate, and load patents from PatentsView API
   * 
   * @param query The query to send to PatentsView API
   * @param fields The fields to request from PatentsView API
   * @param options Additional options for the API request
   * @returns Observable with the integration results
   */
  integratePatentsViewData(
    query: any, 
    fields?: string[], 
    options?: { sort?: any[], per_page?: number, page?: number }
  ): Observable<IntegrationResult> {
    return this.patentsViewApiClient.getPatents(query, fields, options).pipe(
      tap(response => console.log(`Fetched ${response.patents?.length || 0} patents from PatentsView API`)),
      map(response => response.patents || []),
      map(patents => this.patentsViewTransformer.transformPatents(patents)),
      tap(transformedPatents => console.log(`Transformed ${transformedPatents.length} patents to unified model`)),
      mergeMap(transformedPatents => this.validateAndLoadPatents(transformedPatents)),
      catchError(error => {
        console.error('Error in PatentsView data integration:', error);
        return throwError(() => new Error(`PatentsView integration failed: ${error.message}`));
      })
    );
  }

  /**
   * Fetch a single patent by ID from PatentsView, transform, validate, and load it
   * 
   * @param patentId The patent ID to fetch
   * @param fields The fields to request from PatentsView API
   * @returns Observable with the integration result
   */
  integratePatentById(patentId: string, fields?: string[]): Observable<IntegrationResult> {
    return this.patentsViewApiClient.getPatentById(patentId, fields).pipe(
      map(response => response.patents?.[0]),
      mergeMap(patent => {
        if (!patent) {
          return throwError(() => new Error(`Patent with ID ${patentId} not found`));
        }
        
        const transformedPatent = this.patentsViewTransformer.transformPatent(patent);
        return this.validateAndLoadPatent(transformedPatent);
      }),
      catchError(error => {
        console.error(`Error integrating patent ${patentId}:`, error);
        return throwError(() => new Error(`Patent integration failed: ${error.message}`));
      })
    );
  }

  /**
   * Fetch patents by date range from PatentsView, transform, validate, and load them
   * 
   * @param startDate Start date in YYYY-MM-DD format
   * @param endDate End date in YYYY-MM-DD format
   * @param fields The fields to request from PatentsView API
   * @param options Additional options for the API request
   * @returns Observable with the integration results
   */
  integratePatentsByDateRange(
    startDate: string, 
    endDate: string, 
    fields?: string[], 
    options?: { sort?: any[], per_page?: number, page?: number }
  ): Observable<IntegrationResult> {
    return this.patentsViewApiClient.getPatentsByDateRange(startDate, endDate, fields, options).pipe(
      tap(response => console.log(`Fetched ${response.patents?.length || 0} patents from date range ${startDate} to ${endDate}`)),
      map(response => response.patents || []),
      map(patents => this.patentsViewTransformer.transformPatents(patents)),
      mergeMap(transformedPatents => this.validateAndLoadPatents(transformedPatents)),
      catchError(error => {
        console.error('Error in date range patent integration:', error);
        return throwError(() => new Error(`Date range integration failed: ${error.message}`));
      })
    );
  }

  /**
   * Validate and load a single patent into Firestore
   * 
   * @param patent The patent to validate and load
   * @returns Observable with the integration result
   */
  private validateAndLoadPatent(patent: Patent): Observable<IntegrationResult> {
    // Validate the patent
    const validationResult = this.patentValidator.validatePatent(patent);
    
    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors
        .filter(error => error.severity === 'error')
        .map(error => `${error.field}: ${error.message}`)
        .join(', ');
      
      if (errorMessages) {
        console.error(`Validation failed for patent ${patent.patent_id}:`, errorMessages);
        return of({
          success: false,
          totalProcessed: 1,
          successCount: 0,
          failureCount: 1,
          errors: [{
            patent_id: patent.patent_id,
            error: `Validation failed: ${errorMessages}`
          }]
        });
      }
      
      // Log warnings but continue with loading
      const warningMessages = validationResult.errors
        .filter(error => error.severity === 'warning')
        .map(error => `${error.field}: ${error.message}`)
        .join(', ');
      
      if (warningMessages) {
        console.warn(`Validation warnings for patent ${patent.patent_id}:`, warningMessages);
      }
    }

    // Calculate completeness score
    const completenessScore = this.patentValidator.calculateCompletenessScore(patent);
    console.log(`Patent ${patent.patent_id} completeness score: ${completenessScore}%`);

    // Load the patent into Firestore
    return this.loadPatentToFirestore(patent).pipe(
      map(success => ({
        success: success,
        totalProcessed: 1,
        successCount: success ? 1 : 0,
        failureCount: success ? 0 : 1,
        errors: success ? [] : [{
          patent_id: patent.patent_id,
          error: 'Failed to load patent to Firestore'
        }]
      }))
    );
  }

  /**
   * Validate and load multiple patents into Firestore
   * 
   * @param patents The patents to validate and load
   * @returns Observable with the integration results
   */
  private validateAndLoadPatents(patents: Patent[]): Observable<IntegrationResult> {
    if (!patents || patents.length === 0) {
      return of({
        success: true,
        totalProcessed: 0,
        successCount: 0,
        failureCount: 0,
        errors: []
      });
    }

    // Process patents in batches to avoid Firestore limits
    const batches: Patent[][] = [];
    for (let i = 0; i < patents.length; i += this.BATCH_SIZE) {
      batches.push(patents.slice(i, i + this.BATCH_SIZE));
    }

    // Process each batch and combine results
    return forkJoin(
      batches.map(batch => this.processBatch(batch))
    ).pipe(
      map(results => {
        // Combine results from all batches
        const combinedResult: IntegrationResult = {
          success: results.every(r => r.success),
          totalProcessed: results.reduce((sum, r) => sum + r.totalProcessed, 0),
          successCount: results.reduce((sum, r) => sum + r.successCount, 0),
          failureCount: results.reduce((sum, r) => sum + r.failureCount, 0),
          errors: results.flatMap(r => r.errors)
        };
        
        return combinedResult;
      })
    );
  }

  /**
   * Process a batch of patents
   * 
   * @param patents Batch of patents to process
   * @returns Observable with integration results
   */
  private processBatch(patents: Patent[]): Observable<IntegrationResult> {
    const batch = writeBatch(this.firestore);
    const results: { success: boolean, patent_id: string, error?: string }[] = [];

    // Validate each patent and add to batch
    for (const patent of patents) {
      const validationResult = this.patentValidator.validatePatent(patent);
      
      if (!validationResult.isValid) {
        const errorMessages = validationResult.errors
          .filter(error => error.severity === 'error')
          .map(error => `${error.field}: ${error.message}`)
          .join(', ');
        
        if (errorMessages) {
          results.push({
            patent_id: patent.patent_id,
            success: false,
            error: `Validation failed: ${errorMessages}`
          });
          continue; // Skip this patent
        }
      }

      // Add to batch
      const docRef = doc(collection(this.firestore, this.PATENTS_COLLECTION), patent.patent_id);
      
      // Convert dates to proper format
      const patentToSave = this.preparePatentForFirestore(patent);
      
      batch.set(docRef, patentToSave, { merge: true });
      
      results.push({
        patent_id: patent.patent_id,
        success: true
      });
    }

    // Commit the batch
    return from(batch.commit()).pipe(
      map(() => {
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;
        
        return {
          success: failureCount === 0,
          totalProcessed: results.length,
          successCount,
          failureCount,
          errors: results.filter(r => !r.success).map(r => ({
            patent_id: r.patent_id,
            error: r.error || 'Unknown error'
          }))
        };
      }),
      catchError(error => {
        // Mark all as failed
        return of({
          success: false,
          totalProcessed: patents.length,
          successCount: 0,
          failureCount: patents.length,
          errors: patents.map(patent => ({
            patent_id: patent.patent_id,
            error: `Batch commit failed: ${error.message}`
          }))
        });
      })
    );
  }

  /**
   * Load a patent to Firestore
   * 
   * @param patent The patent to load
   * @returns Observable with success flag
   */
  private loadPatentToFirestore(patent: Patent): Observable<boolean> {
    const patentToSave = this.preparePatentForFirestore(patent);
    const docRef = doc(collection(this.firestore, this.PATENTS_COLLECTION), patent.patent_id);
    
    // Check if patent already exists
    return from(getDoc(docRef)).pipe(
      mergeMap(docSnap => {
        if (docSnap.exists()) {
          // Update existing patent
          const existingPatent = docSnap.data() as Patent;
          const updatedPatent = this.preparePatentForUpdate(patent, existingPatent);
          
          return from(setDoc(docRef, updatedPatent, { merge: true }))
            .pipe(
              map(() => true),
              catchError(error => {
                console.error(`Error updating patent ${patent.patent_id}:`, error);
                return of(false);
              })
            );
        } else {
          // Create new patent
          return from(setDoc(docRef, patentToSave))
            .pipe(
              map(() => true),
              catchError(error => {
                console.error(`Error creating patent ${patent.patent_id}:`, error);
                return of(false);
              })
            );
        }
      })
    );
  }

  /**
   * Prepare a patent object for Firestore storage
   * 
   * @param patent The patent object to prepare
   * @returns Prepared patent object
   */
  private preparePatentForFirestore(patent: Patent): any {
    const patentCopy = JSON.parse(JSON.stringify(patent));
    
    // Ensure dates are proper Date objects
    if (patentCopy.dates) {
      if (patentCopy.dates.filing && typeof patentCopy.dates.filing === 'string') {
        patentCopy.dates.filing = new Date(patentCopy.dates.filing);
      }
      if (patentCopy.dates.publication && typeof patentCopy.dates.publication === 'string') {
        patentCopy.dates.publication = new Date(patentCopy.dates.publication);
      }
      if (patentCopy.dates.grant && typeof patentCopy.dates.grant === 'string') {
        patentCopy.dates.grant = new Date(patentCopy.dates.grant);
      }
      if (patentCopy.dates.priority && typeof patentCopy.dates.priority === 'string') {
        patentCopy.dates.priority = new Date(patentCopy.dates.priority);
      }
    }
    
    // Ensure metadata dates are proper Date objects
    if (patentCopy.metadata) {
      if (patentCopy.metadata.created_at && typeof patentCopy.metadata.created_at === 'string') {
        patentCopy.metadata.created_at = new Date(patentCopy.metadata.created_at);
      }
      if (patentCopy.metadata.updated_at && typeof patentCopy.metadata.updated_at === 'string') {
        patentCopy.metadata.updated_at = new Date(patentCopy.metadata.updated_at);
      }
      
      // Convert change history dates
      if (patentCopy.metadata.change_history && Array.isArray(patentCopy.metadata.change_history)) {
        patentCopy.metadata.change_history.forEach((entry: any) => {
          if (entry.timestamp && typeof entry.timestamp === 'string') {
            entry.timestamp = new Date(entry.timestamp);
          }
        });
      }
    }
    
    // Convert legal event dates
    if (patentCopy.legal_status && patentCopy.legal_status.events && Array.isArray(patentCopy.legal_status.events)) {
      patentCopy.legal_status.events.forEach((event: any) => {
        if (event.date && typeof event.date === 'string') {
          event.date = new Date(event.date);
        }
      });
    }
    
    return patentCopy;
  }

  /**
   * Prepare a patent object for updating in Firestore
   * Handles version control and change tracking
   * 
   * @param newPatent The new patent data
   * @param existingPatent The existing patent data
   * @returns Updated patent object
   */
  private preparePatentForUpdate(newPatent: Patent, existingPatent: any): any {
    const patentToUpdate = this.preparePatentForFirestore(newPatent);
    
    // Increment version
    if (existingPatent.metadata && existingPatent.metadata.version) {
      patentToUpdate.metadata.version = existingPatent.metadata.version + 1;
    }
    
    // Update the updated_at timestamp
    patentToUpdate.metadata.updated_at = new Date();
    
    // Track changed fields
    const changedFields = this.detectChangedFields(newPatent, existingPatent);
    
    // Add to change history
    if (!patentToUpdate.metadata.change_history) {
      patentToUpdate.metadata.change_history = [];
    }
    
    patentToUpdate.metadata.change_history.push({
      version: patentToUpdate.metadata.version,
      timestamp: new Date(),
      source: newPatent.source,
      fields_changed: changedFields
    });
    
    return patentToUpdate;
  }

  /**
   * Detect which fields have changed between two patent objects
   * 
   * @param newPatent The new patent data
   * @param existingPatent The existing patent data
   * @returns Array of changed field paths
   */
  private detectChangedFields(newPatent: Patent, existingPatent: any): string[] {
    const changedFields: string[] = [];
    
    // Compare top-level fields
    const topLevelFields = [
      'title', 'abstract', 'description', 'kind_code'
    ];
    
    topLevelFields.forEach(field => {
      if (newPatent[field as keyof Patent] !== existingPatent[field]) {
        changedFields.push(field);
      }
    });
    
    // Compare dates
    if (newPatent.dates && existingPatent.dates) {
      const dateFields = ['filing', 'publication', 'grant', 'priority'];
      
      dateFields.forEach(field => {
        const newDate = newPatent.dates[field as keyof typeof newPatent.dates];
        const existingDate = existingPatent.dates[field];
        
        if (this.datesAreDifferent(newDate, existingDate)) {
          changedFields.push(`dates.${field}`);
        }
      });
    }
    
    // Compare arrays by length (simplified comparison)
    const arrayFields = [
      'inventors', 'assignees', 'claims', 'classifications', 'citations'
    ];
    
    arrayFields.forEach(field => {
      const newArray = newPatent[field as keyof Patent] as any[];
      const existingArray = existingPatent[field] as any[];
      
      if (Array.isArray(newArray) && Array.isArray(existingArray)) {
        if (newArray.length !== existingArray.length) {
          changedFields.push(field);
        }
      } else if (Array.isArray(newArray) !== Array.isArray(existingArray)) {
        changedFields.push(field);
      }
    });
    
    // If no specific fields detected, mark as general update
    if (changedFields.length === 0) {
      changedFields.push('general_update');
    }
    
    return changedFields;
  }

  /**
   * Compare two dates for equality, handling different date formats
   * 
   * @param date1 First date
   * @param date2 Second date
   * @returns True if dates are different
   */
  private datesAreDifferent(date1: any, date2: any): boolean {
    if (!date1 && !date2) {
      return false;
    }
    
    if (!date1 || !date2) {
      return true;
    }
    
    // Convert to milliseconds for comparison
    let time1: number;
    let time2: number;
    
    if (date1 instanceof Date) {
      time1 = date1.getTime();
    } else if (typeof date1 === 'string') {
      time1 = new Date(date1).getTime();
    } else if (date1.toDate && typeof date1.toDate === 'function') {
      // Firestore Timestamp
      time1 = date1.toDate().getTime();
    } else {
      return true; // Unknown format, consider different
    }
    
    if (date2 instanceof Date) {
      time2 = date2.getTime();
    } else if (typeof date2 === 'string') {
      time2 = new Date(date2).getTime();
    } else if (date2.toDate && typeof date2.toDate === 'function') {
      // Firestore Timestamp
      time2 = date2.toDate().getTime();
    } else {
      return true; // Unknown format, consider different
    }
    
    return time1 !== time2;
  }
}

/**
 * Integration result interface
 */
export interface IntegrationResult {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  errors: {
    patent_id: string;
    error: string;
  }[];
}
