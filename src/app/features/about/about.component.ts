import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {

  constructor(
    private title: Title,
    private meta: Meta
  ) { }

  ngOnInit(): void {
    this.title.setTitle('About Edison | Patent Information Platform');
    this.meta.updateTag({ 
      name: 'description', 
      content: 'Learn about Edison, the revolutionary patent information platform that simplifies patent search, validation, and documentation.' 
    });
  }
}
