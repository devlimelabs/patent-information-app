import { Injectable } from '@angular/core';
import {
  collection,
  doc,
  DocumentData,
  DocumentReference,
  Firestore,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
} from '@angular/fire/firestore';
import { from, Observable, of, throwError } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';

import { Patent } from '../models/patent.model';
import { PatentValidatorService } from '../validators/patent-validator.service';

/**
 * Firestore Patent Loader Service
 * 
 * Handles loading patent data into Firestore database.
 * Implements batch operations, transaction management, and version control.
 */
@Injectable({
  providedIn: 'root'
})
export class FirestorePatentLoaderService {
  private readonly PATENTS_COLLECTION = 'patents';
  private readonly INVENTORS_COLLECTION = 'inventors';
  private readonly ASSIGNEES_COLLECTION = 'assignees';
  private readonly BATCH_SIZE = 500; // Maximum batch size for Firestore

  constructor(
    private firestore: Firestore,
    private patentValidator: PatentValidatorService
  ) { }

  /**
   * Load a single patent into Firestore
   * 
   * @param patent The patent object to load
   * @returns Observable with the document reference
   */
  loadPatent(patent: Patent): Observable<DocumentReference<DocumentData>> {
    // Validate the patent before loading
    const validationResult = this.patentValidator.validatePatent(patent);
    
    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors
        .filter(error => error.severity === 'error')
        .map(error => `${error.field}: ${error.message}`)
        .join(', ');
      
      if (errorMessages) {
        return throwError(() => new Error(`Patent validation failed: ${errorMessages}`));
      }
      
      // Log warnings but continue with loading
      const warningMessages = validationResult.errors
        .filter(error => error.severity === 'warning')
        .map(error => `${error.field}: ${error.message}`)
        .join(', ');
      
      if (warningMessages) {
        console.warn(`Patent validation warnings: ${warningMessages}`);
      }
    }

    // Check if patent already exists
    return this.checkPatentExists(patent.patent_id).pipe(
      mergeMap(exists => {
        if (exists) {
          return this.updatePatent(patent);
        } else {
          return this.createPatent(patent);
        }
      }),
      catchError(error => {
        console.error('Error loading patent to Firestore:', error);
        return throwError(() => new Error(`Failed to load patent: ${error.message}`));
      })
    );
  }

  /**
   * Load multiple patents into Firestore using batched writes
   * 
   * @param patents Array of patent objects to load
   * @returns Observable with an array of results
   */
  loadPatents(patents: Patent[]): Observable<LoadResult[]> {
    if (!patents || patents.length === 0) {
      return of([]);
    }

    // Process patents in batches to avoid Firestore limits
    const batches: Patent[][] = [];
    for (let i = 0; i < patents.length; i += this.BATCH_SIZE) {
      batches.push(patents.slice(i, i + this.BATCH_SIZE));
    }

    // Process each batch
    return from(batches).pipe(
      mergeMap(batch => this.processBatch(batch)),
      map(results => results.flat())
    );
  }

  /**
   * Process a batch of patents
   * 
   * @param patents Batch of patents to process
   * @returns Observable with array of load results
   */
  private processBatch(patents: Patent[]): Observable<LoadResult[]> {
    const batch = writeBatch(this.firestore);
    const results: LoadResult[] = [];

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
      
      // Convert dates to Firestore Timestamps
      const patentToSave = this.preparePatentForFirestore(patent);
      
      batch.set(docRef, patentToSave, { merge: true });
      
      results.push({
        patent_id: patent.patent_id,
        success: true
      });
    }

    // Commit the batch
    return from(batch.commit()).pipe(
      map(() => results),
      catchError(error => {
        // Mark all as failed
        return of(patents.map(patent => ({
          patent_id: patent.patent_id,
          success: false,
          error: `Batch commit failed: ${error.message}`
        })));
      })
    );
  }

  /**
   * Check if a patent already exists in Firestore
   * 
   * @param patentId The patent ID to check
   * @returns Observable with boolean indicating existence
   */
  private checkPatentExists(patentId: string): Observable<boolean> {
    const docRef = doc(collection(this.firestore, this.PATENTS_COLLECTION), patentId);
    return from(getDoc(docRef)).pipe(
      map(docSnap => docSnap.exists())
    );
  }

  /**
   * Create a new patent document in Firestore
   * 
   * @param patent The patent object to create
   * @returns Observable with the document reference
   */
  private createPatent(patent: Patent): Observable<DocumentReference<DocumentData>> {
    const patentToSave = this.preparePatentForFirestore(patent);
    const docRef = doc(collection(this.firestore, this.PATENTS_COLLECTION), patent.patent_id);
    
    return from(
      setDoc(docRef, patentToSave)
        .then(() => {
          return docRef;
        })
    );
  }

  /**
   * Update an existing patent document in Firestore
   * 
   * @param patent The patent object to update
   * @returns Observable with the document reference
   */
  private updatePatent(patent: Patent): Observable<DocumentReference<DocumentData>> {
    const docRef = doc(collection(this.firestore, this.PATENTS_COLLECTION), patent.patent_id);
    
    return from(getDoc(docRef)).pipe(
      mergeMap(docSnap => {
        if (!docSnap.exists()) {
          return this.createPatent(patent);
        }

        const existingPatent = docSnap.data() as Patent;
        const updatedPatent = this.preparePatentForUpdate(patent, existingPatent);
        
        return from(
          updateDoc(docRef, updatedPatent)
            .then(() => {
              return docRef;
            })
        );
      })
    );
  }

  /**
   * Prepare a patent object for Firestore storage
   * Converting Date objects to Firestore Timestamps
   * 
   * @param patent The patent object to prepare
   * @returns Prepared patent object
   */
  private preparePatentForFirestore(patent: Patent): any {
    const patentCopy = JSON.parse(JSON.stringify(patent));
    
    // Convert dates to Firestore Timestamps
    if (patentCopy.dates) {
      if (patentCopy.dates.filing) {
        patentCopy.dates.filing = this.dateToTimestamp(patentCopy.dates.filing);
      }
      if (patentCopy.dates.publication) {
        patentCopy.dates.publication = this.dateToTimestamp(patentCopy.dates.publication);
      }
      if (patentCopy.dates.grant) {
        patentCopy.dates.grant = this.dateToTimestamp(patentCopy.dates.grant);
      }
      if (patentCopy.dates.priority) {
        patentCopy.dates.priority = this.dateToTimestamp(patentCopy.dates.priority);
      }
    }
    
    // Convert metadata dates
    if (patentCopy.metadata) {
      if (patentCopy.metadata.created_at) {
        patentCopy.metadata.created_at = this.dateToTimestamp(patentCopy.metadata.created_at);
      }
      if (patentCopy.metadata.updated_at) {
        patentCopy.metadata.updated_at = this.dateToTimestamp(patentCopy.metadata.updated_at);
      }
      
      // Convert change history dates
      if (patentCopy.metadata.change_history && Array.isArray(patentCopy.metadata.change_history)) {
        patentCopy.metadata.change_history.forEach((entry: any) => {
          if (entry.timestamp) {
            entry.timestamp = this.dateToTimestamp(entry.timestamp);
          }
        });
      }
    }
    
    // Convert legal event dates
    if (patentCopy.legal_status && patentCopy.legal_status.events && Array.isArray(patentCopy.legal_status.events)) {
      patentCopy.legal_status.events.forEach((event: any) => {
        if (event.date) {
          event.date = this.dateToTimestamp(event.date);
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
   * Convert a Date object or string to Firestore Timestamp
   * 
   * @param date Date object or string
   * @returns Firestore Timestamp
   */
  private dateToTimestamp(date: Date | string): any {
    if (date instanceof Date) {
      return date;
    } else if (typeof date === 'string') {
      return new Date(date);
    }
    return date; // Already a Timestamp or null
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
 * Load result interface
 */
export interface LoadResult {
  patent_id: string;
  success: boolean;
  error?: string;
}
