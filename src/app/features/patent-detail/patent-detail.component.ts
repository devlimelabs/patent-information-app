import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Patent } from '../../core/data-integration/models/patent.model';
import { SemanticSearchService } from '../../core/data-integration/services/semantic-search.service';

@Component({
  selector: 'app-patent-detail',
  templateUrl: './patent-detail.component.html',
  styleUrls: ['./patent-detail.component.scss']
})
export class PatentDetailComponent implements OnInit {
  patentId: string = '';
  patent$: Observable<Patent | null> = of(null);
  similarPatents$: Observable<Patent[]> = of([]);
  isLoading = true;
  error: string | null = null;
  activeTab = 'overview';

  constructor(
    private route: ActivatedRoute,
    private semanticSearchService: SemanticSearchService,
    private title: Title,
    private meta: Meta
  ) { }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.patentId = params.get('id') || '';
        this.isLoading = true;
        this.error = null;
        
        if (!this.patentId) {
          this.error = 'Patent ID is required';
          this.isLoading = false;
          return of(null);
        }
        
        // Get patent details
        return this.semanticSearchService.getPatentById(this.patentId).pipe(
          catchError(error => {
            this.error = `Error loading patent: ${error.message}`;
            this.isLoading = false;
            return of(null);
          })
        );
      })
    ).subscribe(patent => {
      this.isLoading = false;
      
      if (patent) {
        // Set page title and meta tags
        this.title.setTitle(`${patent.title} | Patent ${patent.patent_id} | Edison`);
        this.meta.updateTag({ name: 'description', content: patent.abstract });
        
        // Add structured data for SEO
        this.addStructuredData(patent);
        
        // Load similar patents
        this.loadSimilarPatents(patent.patent_id);
      }
    });
  }

  /**
   * Load similar patents based on the current patent
   */
  loadSimilarPatents(patentId: string): void {
    this.similarPatents$ = this.semanticSearchService.findSimilarPatents(patentId, 5).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Set active tab
   */
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  /**
   * Add structured data markup for SEO
   */
  private addStructuredData(patent: Patent): void {
    // Create schema.org structured data
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      'headline': patent.title,
      'description': patent.abstract,
      'datePublished': patent.dates.publication ? new Date(patent.dates.publication).toISOString() : undefined,
      'author': patent.inventors.map(inventor => ({
        '@type': 'Person',
        'name': inventor.name,
        'affiliation': patent.assignees.length > 0 ? patent.assignees[0].name : undefined
      })),
      'publisher': patent.assignees.length > 0 ? {
        '@type': 'Organization',
        'name': patent.assignees[0].name,
        'location': patent.assignees[0].location ? {
          '@type': 'Place',
          'address': {
            '@type': 'PostalAddress',
            'addressCountry': patent.assignees[0].location.country,
            'addressRegion': patent.assignees[0].location.state,
            'addressLocality': patent.assignees[0].location.city
          }
        } : undefined
      } : undefined,
      'about': patent.classifications.map(classification => ({
        '@type': 'Thing',
        'name': classification.description || classification.code
      })),
      'identifier': patent.patent_id
    };

    // Add structured data to page
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | undefined): string {
    if (!date) return 'Not available';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Get inventors as formatted string
   */
  getInventorsString(patent: Patent): string {
    if (!patent.inventors || patent.inventors.length === 0) {
      return 'Not available';
    }
    return patent.inventors.map(inventor => inventor.name).join(', ');
  }

  /**
   * Get assignees as formatted string
   */
  getAssigneesString(patent: Patent): string {
    if (!patent.assignees || patent.assignees.length === 0) {
      return 'Not available';
    }
    return patent.assignees.map(assignee => assignee.name).join(', ');
  }
}
