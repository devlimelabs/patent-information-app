import { Injectable } from '@angular/core';

import { Assignee, Citation, Claim, Classification, Inventor, Metadata, Patent } from '../models/patent.model';

/**
 * PatentsView Transformer Service
 * 
 * Transforms raw PatentsView API data into the unified patent model format.
 * Handles field mapping, normalization, and data type conversions.
 */
@Injectable({
  providedIn: 'root'
})
export class PatentsViewTransformerService {

  constructor() { }

  /**
   * Transform a PatentsView patent object to the unified Patent model
   * 
   * @param patentsViewPatent The raw patent data from PatentsView API
   * @returns A transformed Patent object conforming to the unified model
   */
  transformPatent(patentsViewPatent: any): Patent {
    if (!patentsViewPatent) {
      throw new Error('Invalid patent data: Patent data is null or undefined');
    }

    // Create a new Patent object with transformed data
    const transformedPatent: Patent = {
      patent_id: patentsViewPatent.patent_id,
      external_ids: {
        patentsview_id: patentsViewPatent.patent_id
      },
      source: 'patentsview',
      kind_code: patentsViewPatent.patent_kind || '',
      title: patentsViewPatent.patent_title || '',
      abstract: patentsViewPatent.patent_abstract || '',
      description: patentsViewPatent.patent_description || '',
      claims: this.transformClaims(patentsViewPatent.claims),
      dates: {
        filing: patentsViewPatent.application_date ? new Date(patentsViewPatent.application_date) : undefined,
        publication: patentsViewPatent.patent_date ? new Date(patentsViewPatent.patent_date) : undefined,
        grant: patentsViewPatent.patent_date ? new Date(patentsViewPatent.patent_date) : undefined,
        priority: patentsViewPatent.patent_earliest_application_date ? 
          new Date(patentsViewPatent.patent_earliest_application_date) : undefined
      },
      inventors: this.transformInventors(patentsViewPatent.inventors),
      assignees: this.transformAssignees(patentsViewPatent.assignees),
      classifications: this.transformClassifications(patentsViewPatent),
      citations: this.transformCitations(patentsViewPatent.cited_patents),
      metadata: this.createMetadata(patentsViewPatent)
    };

    return transformedPatent;
  }

  /**
   * Transform multiple PatentsView patent objects
   * 
   * @param patentsViewPatents Array of raw patent data from PatentsView API
   * @returns Array of transformed Patent objects
   */
  transformPatents(patentsViewPatents: any[]): Patent[] {
    if (!patentsViewPatents || !Array.isArray(patentsViewPatents)) {
      return [];
    }

    return patentsViewPatents.map(patent => this.transformPatent(patent));
  }

  /**
   * Transform PatentsView claims to unified Claim model
   * 
   * @param patentsViewClaims The claims data from PatentsView API
   * @returns Array of transformed Claim objects
   */
  private transformClaims(patentsViewClaims: any[]): Claim[] {
    if (!patentsViewClaims || !Array.isArray(patentsViewClaims)) {
      return [];
    }

    return patentsViewClaims.map((claim, index) => {
      const claimObj: Claim = {
        number: index + 1,
        text: claim.claim_text || '',
      };

      // Add dependency information if available
      if (claim.dependent_claim_id) {
        // Extract the claim number from the dependent claim ID
        const dependentMatch = claim.dependent_claim_id.match(/\d+$/);
        if (dependentMatch) {
          claimObj.dependent_on = parseInt(dependentMatch[0], 10);
        }
      }

      return claimObj;
    });
  }

  /**
   * Transform PatentsView inventors to unified Inventor model
   * 
   * @param patentsViewInventors The inventors data from PatentsView API
   * @returns Array of transformed Inventor objects
   */
  private transformInventors(patentsViewInventors: any[]): Inventor[] {
    if (!patentsViewInventors || !Array.isArray(patentsViewInventors)) {
      return [];
    }

    return patentsViewInventors.map(inventor => {
      return {
        name: inventor.inventor_name || '',
        location: {
          country: inventor.inventor_country || '',
          state: inventor.inventor_state || '',
          city: inventor.inventor_city || ''
        },
        normalized_id: inventor.inventor_id || undefined
      };
    });
  }

  /**
   * Transform PatentsView assignees to unified Assignee model
   * 
   * @param patentsViewAssignees The assignees data from PatentsView API
   * @returns Array of transformed Assignee objects
   */
  private transformAssignees(patentsViewAssignees: any[]): Assignee[] {
    if (!patentsViewAssignees || !Array.isArray(patentsViewAssignees)) {
      return [];
    }

    return patentsViewAssignees.map(assignee => {
      return {
        name: assignee.assignee_name || '',
        type: this.mapAssigneeType(assignee.assignee_type),
        location: {
          country: assignee.assignee_country || '',
          state: assignee.assignee_state || '',
          city: assignee.assignee_city || ''
        },
        normalized_id: assignee.assignee_id || undefined
      };
    });
  }

  /**
   * Map PatentsView assignee type codes to human-readable types
   * 
   * @param typeCode The assignee type code from PatentsView
   * @returns Human-readable assignee type
   */
  private mapAssigneeType(typeCode: string): string {
    const typeMap: { [key: string]: string } = {
      '2': 'U.S. Company or Corporation',
      '3': 'Foreign Company or Corporation',
      '4': 'U.S. Individual',
      '5': 'Foreign Individual',
      '6': 'U.S. Federal Government',
      '7': 'Foreign Government',
      '8': 'U.S. County Government',
      '9': 'U.S. State Government'
    };

    return typeMap[typeCode] || 'Unknown';
  }

  /**
   * Transform PatentsView classifications to unified Classification model
   * 
   * @param patentsViewPatent The patent data containing classification information
   * @returns Array of transformed Classification objects
   */
  private transformClassifications(patentsViewPatent: any): Classification[] {
    const classifications: Classification[] = [];

    // Process CPC classifications
    if (patentsViewPatent.cpc_subsections && Array.isArray(patentsViewPatent.cpc_subsections)) {
      patentsViewPatent.cpc_subsections.forEach((cpc: any) => {
        classifications.push({
          system: 'CPC',
          code: cpc.cpc_subsection_id || '',
          description: cpc.cpc_subsection_title || '',
          hierarchy: cpc.cpc_subsection_id ? [cpc.cpc_subsection_id.substring(0, 1), cpc.cpc_subsection_id] : []
        });
      });
    }

    // Process USPC classifications
    if (patentsViewPatent.uspc_mainclasses && Array.isArray(patentsViewPatent.uspc_mainclasses)) {
      patentsViewPatent.uspc_mainclasses.forEach((uspc: any) => {
        classifications.push({
          system: 'USPC',
          code: uspc.uspc_mainclass_id || '',
          description: uspc.uspc_mainclass_title || ''
        });
      });
    }

    // Process IPC classifications
    if (patentsViewPatent.ipcr_subsections && Array.isArray(patentsViewPatent.ipcr_subsections)) {
      patentsViewPatent.ipcr_subsections.forEach((ipc: any) => {
        classifications.push({
          system: 'IPC',
          code: ipc.ipcr_subsection_id || '',
          description: ipc.ipcr_subsection_title || ''
        });
      });
    }

    return classifications;
  }

  /**
   * Transform PatentsView citations to unified Citation model
   * 
   * @param patentsViewCitations The citations data from PatentsView API
   * @returns Array of transformed Citation objects
   */
  private transformCitations(patentsViewCitations: any[]): Citation[] {
    if (!patentsViewCitations || !Array.isArray(patentsViewCitations)) {
      return [];
    }

    return patentsViewCitations.map(citation => {
      return {
        patent_id: citation.cited_patent_id || '',
        citation_type: citation.citation_category || 'cited'
      };
    });
  }

  /**
   * Create metadata for the transformed patent
   * 
   * @param patentsViewPatent The raw patent data from PatentsView API
   * @returns Metadata object
   */
  private createMetadata(patentsViewPatent: any): Metadata {
    const now = new Date();
    
    return {
      created_at: now,
      updated_at: now,
      version: 1,
      source_version: {
        patentsview: patentsViewPatent.patentsview_update_date || 'unknown'
      },
      change_history: [
        {
          version: 1,
          timestamp: now,
          source: 'patentsview',
          fields_changed: ['all']
        }
      ]
    };
  }
}
