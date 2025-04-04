import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(
    private title: Title,
    private meta: Meta
  ) { }

  ngOnInit(): void {
    this.title.setTitle('Edison - Patent Information Platform');
    this.meta.updateTag({ 
      name: 'description', 
      content: 'Edison simplifies patent information and democratizes access to intellectual property tools for inventors and businesses of all sizes.' 
    });
  }
}
