import { Injectable } from '@angular/core';

import { Patent } from '../models/patent.model';

/**
 * Patent Validator Service
 * 
 * Provides validation for patent data to ensure quality and consistency.
 * Implements various validation rules and checks for data completeness.
 */
@Injectable({
  providedIn: 'root'
})
export class PatentValidatorService {

  constructor() { }

  /**
   * Validate a patent object against the unified schema
   * 
   * @param patent The patent object to validate
   * @returns Validation result with success flag and error messages
   */
  validatePatent(patent: Patent): ValidationResult {
    const errors: ValidationError[] = [];

    // Required field validation
    this.validateRequiredFields(patent, errors);
    
    // Data type validation
    this.validateDataTypes(patent, errors);
    
    // Business rule validation
    this.validateBusinessRules(patent, errors);

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Validate required fields in the patent object
   * 
   * @param patent The patent object to validate
   * @param errors Array to collect validation errors
   */
  private validateRequiredFields(patent: Patent, errors: ValidationError[]): void {
    // Check for required top-level fields
    if (!patent.patent_id) {
      errors.push({
        field: 'patent_id',
        message: 'Patent ID is required',
        severity: 'error'
      });
    }

    if (!patent.source) {
      errors.push({
        field: 'source',
        message: 'Source identifier is required',
        severity: 'error'
      });
    }

    if (!patent.title) {
      errors.push({
        field: 'title',
        message: 'Patent title is required',
        severity: 'warning'
      });
    }

    // Check for required metadata fields
    if (!patent.metadata) {
      errors.push({
        field: 'metadata',
        message: 'Metadata is required',
        severity: 'error'
      });
    } else {
      if (!patent.metadata.created_at) {
        errors.push({
          field: 'metadata.created_at',
          message: 'Created date is required in metadata',
          severity: 'error'
        });
      }
      
      if (!patent.metadata.updated_at) {
        errors.push({
          field: 'metadata.updated_at',
          message: 'Updated date is required in metadata',
          severity: 'error'
        });
      }
      
      if (patent.metadata.version === undefined || patent.metadata.version === null) {
        errors.push({
          field: 'metadata.version',
          message: 'Version number is required in metadata',
          severity: 'error'
        });
      }
    }
  }

  /**
   * Validate data types in the patent object
   * 
   * @param patent The patent object to validate
   * @param errors Array to collect validation errors
   */
  private validateDataTypes(patent: Patent, errors: ValidationError[]): void {
    // Validate patent_id is a string
    if (patent.patent_id && typeof patent.patent_id !== 'string') {
      errors.push({
        field: 'patent_id',
        message: 'Patent ID must be a string',
        severity: 'error'
      });
    }

    // Validate dates are Date objects
    if (patent.dates) {
      if (patent.dates.filing && !(patent.dates.filing instanceof Date) && !this.isValidDateString(patent.dates.filing)) {
        errors.push({
          field: 'dates.filing',
          message: 'Filing date must be a valid date',
          severity: 'error'
        });
      }
      
      if (patent.dates.publication && !(patent.dates.publication instanceof Date) && !this.isValidDateString(patent.dates.publication)) {
        errors.push({
          field: 'dates.publication',
          message: 'Publication date must be a valid date',
          severity: 'error'
        });
      }
      
      if (patent.dates.grant && !(patent.dates.grant instanceof Date) && !this.isValidDateString(patent.dates.grant)) {
        errors.push({
          field: 'dates.grant',
          message: 'Grant date must be a valid date',
          severity: 'error'
        });
      }
      
      if (patent.dates.priority && !(patent.dates.priority instanceof Date) && !this.isValidDateString(patent.dates.priority)) {
        errors.push({
          field: 'dates.priority',
          message: 'Priority date must be a valid date',
          severity: 'error'
        });
      }
    }

    // Validate claims array
    if (patent.claims && !Array.isArray(patent.claims)) {
      errors.push({
        field: 'claims',
        message: 'Claims must be an array',
        severity: 'error'
      });
    } else if (patent.claims) {
      // Validate each claim
      patent.claims.forEach((claim, index) => {
        if (typeof claim.number !== 'number') {
          errors.push({
            field: `claims[${index}].number`,
            message: 'Claim number must be a number',
            severity: 'error'
          });
        }
        
        if (typeof claim.text !== 'string') {
          errors.push({
            field: `claims[${index}].text`,
            message: 'Claim text must be a string',
            severity: 'error'
          });
        }
        
        if (claim.dependent_on !== undefined && typeof claim.dependent_on !== 'number') {
          errors.push({
            field: `claims[${index}].dependent_on`,
            message: 'Dependent claim reference must be a number',
            severity: 'error'
          });
        }
      });
    }

    // Validate inventors array
    if (patent.inventors && !Array.isArray(patent.inventors)) {
      errors.push({
        field: 'inventors',
        message: 'Inventors must be an array',
        severity: 'error'
      });
    }

    // Validate assignees array
    if (patent.assignees && !Array.isArray(patent.assignees)) {
      errors.push({
        field: 'assignees',
        message: 'Assignees must be an array',
        severity: 'error'
      });
    }

    // Validate classifications array
    if (patent.classifications && !Array.isArray(patent.classifications)) {
      errors.push({
        field: 'classifications',
        message: 'Classifications must be an array',
        severity: 'error'
      });
    }

    // Validate citations array
    if (patent.citations && !Array.isArray(patent.citations)) {
      errors.push({
        field: 'citations',
        message: 'Citations must be an array',
        severity: 'error'
      });
    }
  }

  /**
   * Validate business rules for the patent object
   * 
   * @param patent The patent object to validate
   * @param errors Array to collect validation errors
   */
  private validateBusinessRules(patent: Patent, errors: ValidationError[]): void {
    // Check for logical date sequence
    if (patent.dates) {
      const filingDate = patent.dates.filing instanceof Date ? patent.dates.filing : 
                         (typeof patent.dates.filing === 'string' ? new Date(patent.dates.filing) : null);
      
      const publicationDate = patent.dates.publication instanceof Date ? patent.dates.publication : 
                             (typeof patent.dates.publication === 'string' ? new Date(patent.dates.publication) : null);
      
      const grantDate = patent.dates.grant instanceof Date ? patent.dates.grant : 
                       (typeof patent.dates.grant === 'string' ? new Date(patent.dates.grant) : null);
      
      // Filing date should be before publication date
      if (filingDate && publicationDate && filingDate > publicationDate) {
        errors.push({
          field: 'dates',
          message: 'Filing date cannot be after publication date',
          severity: 'warning'
        });
      }
      
      // Filing date should be before grant date
      if (filingDate && grantDate && filingDate > grantDate) {
        errors.push({
          field: 'dates',
          message: 'Filing date cannot be after grant date',
          severity: 'warning'
        });
      }
    }

    // Check for valid claim dependencies
    if (patent.claims && Array.isArray(patent.claims)) {
      patent.claims.forEach((claim, index) => {
        if (claim.dependent_on !== undefined) {
          // Dependent claim should reference a valid claim number
          if (claim.dependent_on <= 0 || claim.dependent_on >= claim.number) {
            errors.push({
              field: `claims[${index}].dependent_on`,
              message: `Invalid dependent claim reference: ${claim.dependent_on}`,
              severity: 'warning'
            });
          }
        }
      });
    }

    // Check for valid external IDs based on source
    if (patent.source === 'patentsview' && !patent.external_ids?.patentsview_id) {
      errors.push({
        field: 'external_ids.patentsview_id',
        message: 'PatentsView ID is required for patents from PatentsView source',
        severity: 'warning'
      });
    } else if (patent.source === 'epo' && !patent.external_ids?.epo_id) {
      errors.push({
        field: 'external_ids.epo_id',
        message: 'EPO ID is required for patents from EPO source',
        severity: 'warning'
      });
    } else if (patent.source === 'wipo' && !patent.external_ids?.wipo_id) {
      errors.push({
        field: 'external_ids.wipo_id',
        message: 'WIPO ID is required for patents from WIPO source',
        severity: 'warning'
      });
    }

    // Check for completeness of metadata
    if (patent.metadata && !patent.metadata.source_version) {
      errors.push({
        field: 'metadata.source_version',
        message: 'Source version information is missing in metadata',
        severity: 'warning'
      });
    }
  }

  /**
   * Check if a value is a valid date string
   * 
   * @param value The value to check
   * @returns True if the value is a valid date string
   */
  private isValidDateString(value: any): boolean {
    if (typeof value !== 'string') {
      return false;
    }
    
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  /**
   * Calculate completeness score for a patent
   * 
   * @param patent The patent object to evaluate
   * @returns Completeness score as a percentage (0-100)
   */
  calculateCompletenessScore(patent: Patent): number {
    let totalFields = 0;
    let populatedFields = 0;

    // Check top-level required fields
    const requiredFields = ['patent_id', 'source', 'title', 'abstract', 'description'];
    totalFields += requiredFields.length;
    
    requiredFields.forEach(field => {
      if ((patent as any)[field]) {
        populatedFields++;
      }
    });

    // Check dates
    if (patent.dates) {
      const dateFields = ['filing', 'publication', 'grant', 'priority'];
      totalFields += dateFields.length;
      
      dateFields.forEach(field => {
        if ((patent.dates as any)[field]) {
          populatedFields++;
        }
      });
    } else {
      totalFields += 4; // Add date fields to total even if dates object is missing
    }

    // Check arrays (inventors, assignees, claims, classifications, citations)
    const arrayFields = [
      { name: 'inventors', minExpected: 1 },
      { name: 'assignees', minExpected: 1 },
      { name: 'claims', minExpected: 1 },
      { name: 'classifications', minExpected: 1 },
      { name: 'citations', minExpected: 0 } // Citations are optional
    ];

    arrayFields.forEach(field => {
      const array = (patent as any)[field.name];
      totalFields++;
      
      if (array && Array.isArray(array) && array.length >= field.minExpected) {
        populatedFields++;
      }
    });

    // Calculate percentage
    return Math.round((populatedFields / totalFields) * 100);
  }
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
