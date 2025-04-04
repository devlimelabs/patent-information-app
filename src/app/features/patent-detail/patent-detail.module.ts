import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PatentDetailComponent } from './patent-detail.component';

const routes: Routes = [
  {
    path: '',
    component: PatentDetailComponent
  }
];

@NgModule({
  declarations: [
    PatentDetailComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class PatentDetailModule { }
