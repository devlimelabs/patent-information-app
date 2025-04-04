import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';

import { Patent } from '../../core/data-integration/models/patent.model';
import { DataIndexingService } from '../../core/data-integration/services/data-indexing.service';
import { SemanticSearchService } from '../../core/data-integration/services/semantic-search.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  searchForm: FormGroup;
  searchResults: any[] = [];
  isLoading = false;
  totalHits = 0;
  searchTime = 0;
  indexStats: any = null;
  isCustomDateRange = false;
  
  // Filters
  patentTypes = ['Utility', 'Design', 'Plant', 'Reissue'];
  dateRanges = ['Last year', 'Last 5 years', 'Last 10 years', 'Custom'];
  
  constructor(
    private formBuilder: FormBuilder,
    private title: Title,
    private meta: Meta,
    private semanticSearchService: SemanticSearchService,
    private dataIndexingService: DataIndexingService
  ) {
    this.searchForm = this.formBuilder.group({
      query: [''],
      patentType: [''],
      dateRange: [''],
      startDate: [''],
      endDate: [''],
      inventor: [''],
      assignee: ['']
    });
  }

  ngOnInit(): void {
    this.title.setTitle('Patent Search | Edison');
    this.meta.updateTag({
      name: 'description',
      content: 'Search patents using Edison\'s powerful semantic search capabilities. Find relevant patents using natural language queries.'
    });
    
    // Initialize Meilisearch index
    this.dataIndexingService.initializeIndex().subscribe({
      next: () => {
        // Get index stats
        this.refreshIndexStats();
        
        // Index sample data if the index is empty
        this.dataIndexingService.getIndexStats().subscribe(stats => {
          if (stats.numberOfDocuments === 0) {
            this.dataIndexingService.indexSamplePatents(20).subscribe(() => {
              this.refreshIndexStats();
            });
          }
        });
      },
      error: (error) => console.error('Error initializing search index:', error)
    });

    // Watch for date range changes
    this.searchForm.get('dateRange')?.valueChanges.subscribe(value => {
      this.isCustomDateRange = value === 'Custom';
    });
  }

  onSearch(): void {
    if (!this.searchForm.value.query.trim()) {
      return;
    }
    
    this.isLoading = true;
    
    // Get filter values
    const filters = {
      patentType: this.searchForm.value.patentType,
      dateRange: this.searchForm.value.dateRange,
      startDate: this.searchForm.value.startDate,
      endDate: this.searchForm.value.endDate,
      inventor: this.searchForm.value.inventor,
      assignee: this.searchForm.value.assignee
    };
    
    // Perform semantic search
    this.semanticSearchService.searchPatents(this.searchForm.value.query, filters)
      .subscribe({
        next: (response) => {
          this.searchResults = response.hits.map((hit: Patent) => ({
            id: hit.patent_id,
            title: hit.title,
            abstract: hit.abstract,
            inventors: hit.inventors.map((inventor: any) => inventor.name),
            assignee: hit.assignees.length > 0 ? hit.assignees[0].name : 'Unknown',
            filingDate: hit.dates.filing ? new Date(hit.dates.filing).toISOString().split('T')[0] : 'Unknown',
            grantDate: hit.dates.grant ? new Date(hit.dates.grant).toISOString().split('T')[0] : 'Unknown'
          }));
          this.totalHits = response.estimatedTotalHits || 0;
          this.searchTime = response.processingTimeMs || 0;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Search error:', error);
          this.isLoading = false;
          this.searchResults = [];
        }
      });
  }
  
  refreshIndexStats(): void {
    this.dataIndexingService.getIndexStats().subscribe({
      next: (stats) => {
        this.indexStats = stats;
      },
      error: (error) => console.error('Error getting index stats:', error)
    });
  }
}
