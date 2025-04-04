import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';

import { PatentsViewApiClient } from '../api-clients/patents-view-api.client';
import { Patent } from '../models/patent.model';
import { PatentsViewTransformerService } from '../transformers/patents-view-transformer.service';
import { MeilisearchService } from './meilisearch.service';

/**
 * Data Indexing Service
 * 
 * Handles the process of fetching patent data from various sources,
 * transforming it to the unified model, and indexing it in Meilisearch.
 */
@Injectable({
  providedIn: 'root'
})
export class DataIndexingService {
  private batchSize = 100;
  private indexingInProgress = false;
  private indexingProgress = 0;
  private totalPatentsToIndex = 0;

  constructor(
    private patentsViewApiClient: PatentsViewApiClient,
    private patentsViewTransformer: PatentsViewTransformerService,
    private meilisearchService: MeilisearchService
  ) { }

  /**
   * Initialize the Meilisearch index
   * 
   * @returns Observable of the initialization result
   */
  initializeIndex(): Observable<any> {
    return this.meilisearchService.initializeIndex();
  }

  /**
   * Get the current indexing status
   * 
   * @returns Object with indexing status information
   */
  getIndexingStatus(): { inProgress: boolean; progress: number; total: number } {
    return {
      inProgress: this.indexingInProgress,
      progress: this.indexingProgress,
      total: this.totalPatentsToIndex
    };
  }

  /**
   * Index patents from PatentsView API
   * 
   * @param query Query parameters for PatentsView API
   * @param options Options for the indexing process
   * @returns Observable of the indexing result
   */
  indexPatentsFromPatentsView(
    query: any = { "_eq": { "patent_date": new Date().toISOString().split('T')[0] } },
    options: { batchSize?: number; maxPatents?: number } = {}
  ): Observable<any> {
    if (this.indexingInProgress) {
      return of({ status: 'error', message: 'Indexing already in progress' });
    }

    this.indexingInProgress = true;
    this.indexingProgress = 0;
    this.batchSize = options.batchSize || this.batchSize;
    
    // Get total count first to track progress
    return this.patentsViewApiClient.getPatents(query, ['patent_id'], { per_page: 1 }).pipe(
      tap(response => {
        this.totalPatentsToIndex = Math.min(
          response.total_patent_count || 0,
          options.maxPatents || Number.MAX_SAFE_INTEGER
        );
      }),
      mergeMap(() => this.fetchAndIndexPatentsBatch(query, 1, options.maxPatents || Number.MAX_SAFE_INTEGER)),
      tap(() => {
        this.indexingInProgress = false;
      }),
      catchError(error => {
        this.indexingInProgress = false;
        console.error('Error indexing patents:', error);
        return of({ status: 'error', message: error.message });
      })
    );
  }

  /**
   * Fetch and index a batch of patents
   * 
   * @param query Query parameters for PatentsView API
   * @param page Current page number
   * @param maxPatents Maximum number of patents to index
   * @returns Observable of the indexing result
   */
  private fetchAndIndexPatentsBatch(query: any, page: number, maxPatents: number): Observable<any> {
    if (this.indexingProgress >= this.totalPatentsToIndex || this.indexingProgress >= maxPatents) {
      return of({ status: 'complete', indexed: this.indexingProgress });
    }

    const fields = [
      'patent_id', 'patent_kind', 'patent_title', 'patent_abstract', 'patent_description',
      'patent_date', 'application_date', 'patent_earliest_application_date',
      'inventors', 'assignees', 'claims',
      'cited_patents', 'cpc_subsections', 'uspc_mainclasses', 'ipcr_subsections'
    ];

    return this.patentsViewApiClient.getPatents(query, fields, {
      per_page: this.batchSize,
      page: page
    }).pipe(
      map(response => {
        const patents = response.patents || [];
        return this.patentsViewTransformer.transformPatents(patents);
      }),
      mergeMap(transformedPatents => {
        if (transformedPatents.length === 0) {
          return of({ status: 'complete', indexed: this.indexingProgress });
        }

        return this.meilisearchService.indexPatents(transformedPatents).pipe(
          tap(() => {
            this.indexingProgress += transformedPatents.length;
          }),
          mergeMap(() => this.fetchAndIndexPatentsBatch(query, page + 1, maxPatents))
        );
      })
    );
  }

  /**
   * Index a single patent document
   * 
   * @param patent The patent document to index
   * @returns Observable of the indexing result
   */
  indexPatent(patent: Patent): Observable<any> {
    return this.meilisearchService.indexPatent(patent);
  }

  /**
   * Get index statistics
   * 
   * @returns Observable of the index statistics
   */
  getIndexStats(): Observable<any> {
    return this.meilisearchService.getIndexStats();
  }

  /**
   * Index sample patents for testing
   * 
   * @param count Number of sample patents to create
   * @returns Observable of the indexing result
   */
  indexSamplePatents(count: number = 10): Observable<any> {
    const samplePatents: Patent[] = [];

    for (let i = 0; i < count; i++) {
      const patentId = `SAMPLE${i.toString().padStart(6, '0')}`;
      
      samplePatents.push({
        patent_id: patentId,
        external_ids: {
          patentsview_id: patentId
        },
        source: 'sample',
        kind_code: 'A1',
        title: `Sample Patent ${i + 1}: Advanced Method for ${this.getRandomTechnology()}`,
        abstract: `This invention relates to ${this.getRandomTechnology()} and provides improved methods for ${this.getRandomApplication()}. The system utilizes ${this.getRandomTechnology()} to enhance efficiency and performance.`,
        description: `Detailed description of a sample patent for ${this.getRandomTechnology()}.`,
        claims: [
          {
            number: 1,
            text: `A method for ${this.getRandomApplication()} comprising steps of processing data using ${this.getRandomTechnology()}.`
          },
          {
            number: 2,
            text: 'The method of claim 1, further comprising additional steps.',
            dependent_on: 1
          }
        ],
        dates: {
          filing: new Date(2020, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          publication: new Date(2022, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          grant: new Date(2022, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
        },
        inventors: [
          {
            name: this.getRandomInventorName(),
            location: {
              country: 'US',
              state: this.getRandomState(),
              city: this.getRandomCity()
            }
          }
        ],
        assignees: [
          {
            name: this.getRandomCompanyName(),
            type: 'U.S. Company or Corporation',
            location: {
              country: 'US',
              state: this.getRandomState(),
              city: this.getRandomCity()
            }
          }
        ],
        classifications: [
          {
            system: 'CPC',
            code: this.getRandomCPCCode(),
            description: `Classification for ${this.getRandomTechnology()}`
          }
        ],
        citations: [],
        metadata: {
          created_at: new Date(),
          updated_at: new Date(),
          version: 1,
          source_version: {
            patentsview: '1.0' // Using patentsview as the source for sample data
          },
          change_history: [
            {
              version: 1,
              timestamp: new Date(),
              source: 'sample',
              fields_changed: ['all']
            }
          ]
        }
      });
    }

    return this.meilisearchService.indexPatents(samplePatents);
  }

  /**
   * Helper method to generate random technology names
   */
  private getRandomTechnology(): string {
    const technologies = [
      'Artificial Intelligence', 'Machine Learning', 'Blockchain', 'Internet of Things',
      'Quantum Computing', 'Virtual Reality', 'Augmented Reality', 'Robotics',
      'Natural Language Processing', 'Computer Vision', 'Neural Networks', 'Cloud Computing',
      'Edge Computing', 'Bioinformatics', 'Nanotechnology', 'Renewable Energy'
    ];
    return technologies[Math.floor(Math.random() * technologies.length)];
  }

  /**
   * Helper method to generate random application descriptions
   */
  private getRandomApplication(): string {
    const applications = [
      'data processing', 'image recognition', 'secure transactions', 'energy optimization',
      'automated decision making', 'predictive analytics', 'natural language understanding',
      'autonomous navigation', 'distributed computing', 'secure communication',
      'pattern recognition', 'resource allocation', 'user authentication', 'data encryption'
    ];
    return applications[Math.floor(Math.random() * applications.length)];
  }

  /**
   * Helper method to generate random inventor names
   */
  private getRandomInventorName(): string {
    const firstNames = [
      'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
      'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica'
    ];
    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson',
      'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin'
    ];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  }

  /**
   * Helper method to generate random company names
   */
  private getRandomCompanyName(): string {
    const prefixes = [
      'Advanced', 'Global', 'Innovative', 'Strategic', 'Dynamic', 'Precision',
      'Quantum', 'Digital', 'Cyber', 'Smart', 'Next-Gen', 'Future'
    ];
    const cores = [
      'Tech', 'Systems', 'Solutions', 'Innovations', 'Networks', 'Dynamics',
      'Logic', 'Data', 'Computing', 'AI', 'Robotics', 'Informatics'
    ];
    const suffixes = [
      'Inc.', 'Corp.', 'LLC', 'Technologies', 'Group', 'Labs',
      'Research', 'International', 'Enterprises', 'Industries', 'Partners', 'Associates'
    ];
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${cores[Math.floor(Math.random() * cores.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
  }

  /**
   * Helper method to generate random US states
   */
  private getRandomState(): string {
    const states = [
      'CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI',
      'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI'
    ];
    return states[Math.floor(Math.random() * states.length)];
  }

  /**
   * Helper method to generate random US cities
   */
  private getRandomCity(): string {
    const cities = [
      'San Francisco', 'New York', 'Austin', 'Seattle', 'Boston', 'Chicago',
      'Los Angeles', 'San Jose', 'Denver', 'Atlanta', 'Dallas', 'Portland',
      'Phoenix', 'Philadelphia', 'San Diego', 'Minneapolis', 'Pittsburgh',
      'Raleigh', 'Charlotte', 'Boulder'
    ];
    return cities[Math.floor(Math.random() * cities.length)];
  }

  /**
   * Helper method to generate random CPC codes
   */
  private getRandomCPCCode(): string {
    const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const section = sections[Math.floor(Math.random() * sections.length)];
    const classNum = Math.floor(Math.random() * 99) + 1;
    const subclassLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `${section}${classNum.toString().padStart(2, '0')}${subclassLetter}`;
  }
}
