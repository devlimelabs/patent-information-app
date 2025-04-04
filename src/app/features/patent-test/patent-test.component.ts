import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { DataIntegrationService, IntegrationResult } from '../../core/data-integration/services/data-integration.service';

@Component({
  selector: 'app-patent-test',
  templateUrl: './patent-test.component.html',
  styleUrls: ['./patent-test.component.scss']
})
export class PatentTestComponent implements OnInit {
  integrationResult$: Observable<IntegrationResult> | null = null;
  isLoading = false;
  errorMessage = '';

  constructor(private dataIntegrationService: DataIntegrationService) { }

  ngOnInit(): void {
  }

  /**
   * Fetch a sample patent by ID
   */
  fetchSamplePatent(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Example patent ID: US10000000
    this.integrationResult$ = this.dataIntegrationService.integratePatentById('US10000000', [
      'patent_id', 
      'patent_title', 
      'patent_abstract', 
      'patent_date', 
      'inventors', 
      'assignees', 
      'cpc_subsections'
    ]);
    
    this.integrationResult$.subscribe({
      next: (result) => {
        console.log('Integration result:', result);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Integration error:', error);
        this.errorMessage = error.message;
        this.isLoading = false;
      }
    });
  }

  /**
   * Fetch recent patents
   */
  fetchRecentPatents(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Get patents from the last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const startDate = this.formatDate(thirtyDaysAgo);
    const endDate = this.formatDate(today);
    
    this.integrationResult$ = this.dataIntegrationService.integratePatentsByDateRange(
      startDate,
      endDate,
      [
        'patent_id', 
        'patent_title', 
        'patent_abstract', 
        'patent_date', 
        'inventors', 
        'assignees', 
        'cpc_subsections'
      ],
      { per_page: 10 }
    );
    
    this.integrationResult$.subscribe({
      next: (result) => {
        console.log('Integration result:', result);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Integration error:', error);
        this.errorMessage = error.message;
        this.isLoading = false;
      }
    });
  }

  /**
   * Format a date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
