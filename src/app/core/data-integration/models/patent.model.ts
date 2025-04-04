/**
 * Patent data model based on the unified patent schema
 * This model represents the normalized patent data structure used across the application
 */

export interface Patent {
  patent_id: string;          // Unique identifier
  external_ids: {             // Source-specific identifiers
    patentsview_id?: string;
    epo_id?: string;
    wipo_id?: string;
  };
  source: string;             // Data source identifier (e.g., 'patentsview', 'epo', 'wipo')
  kind_code: string;          // Document type
  title: string;              // Patent title
  abstract: string;           // Patent abstract
  description: string;        // Full description text
  claims: Claim[];            // Patent claims
  dates: PatentDates;         // Key dates
  inventors: Inventor[];      // Inventors
  assignees: Assignee[];      // Patent owners
  classifications: Classification[]; // Patent classifications
  citations: Citation[];      // Cited patents
  family?: PatentFamily;      // Patent family
  legal_status?: LegalStatus; // Current legal status
  metadata: Metadata;         // System metadata
}

export interface Claim {
  number: number;
  text: string;
  dependent_on?: number;
}

export interface PatentDates {
  filing?: Date;
  publication?: Date;
  grant?: Date;
  priority?: Date;
}

export interface Location {
  country: string;
  state?: string;
  city?: string;
}

export interface Inventor {
  name: string;
  location?: Location;
  normalized_id?: string;   // For disambiguation
}

export interface Assignee {
  name: string;
  type?: string;
  location?: Location;
  normalized_id?: string;
}

export interface Classification {
  system: string;        // CPC, IPC, USPC
  code: string;
  description?: string;
  hierarchy?: string[];
}

export interface Citation {
  patent_id: string;
  citation_type?: string;
}

export interface PatentFamily {
  family_id: string;
  members?: PatentFamilyMember[];
}

export interface PatentFamilyMember {
  patent_id: string;
  country: string;
  kind?: string;
}

export interface LegalEvent {
  code: string;
  date: Date;
  description?: string;
}

export interface LegalStatus {
  status: string;
  events?: LegalEvent[];
}

export interface Metadata {
  created_at: Date;
  updated_at: Date;
  version: number;
  source_version?: {
    patentsview?: string;
    epo?: string;
    wipo?: string;
  };
  change_history?: ChangeHistoryEntry[];
}

export interface ChangeHistoryEntry {
  version: number;
  timestamp: Date;
  source: string;
  fields_changed: string[];
}
