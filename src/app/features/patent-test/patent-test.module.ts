import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PatentTestComponent } from './patent-test.component';

const routes: Routes = [
  {
    path: '',
    component: PatentTestComponent
  }
];

@NgModule({
  declarations: [
    PatentTestComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class PatentTestModule { }
