import { Component, Input, OnInit } from '@angular/core';

import { IonBadge } from "@ionic/angular/standalone";

@Component({
  selector: 'app-grade',
  templateUrl: './grade.component.html',
  styleUrls: ['./grade.component.scss'],
  imports: [IonBadge]
})
export class GradeComponent implements OnInit {
  @Input()
  score!: number

  grade: string = 'F'
  color: string = '#000000'

  constructor() { }

  ngOnInit() {
    if (this.score >= 100) {
      this.grade = 'S';
      this.color = '#FFFAAA'// Light yellow
      return
    }
    if (this.score >= 98) {
      this.grade = 'AAA'
      this.color = '#89adf6'; // Light Blue
      return
    };
    if (this.score >= 95) {
      this.grade = 'AA'
      this.color = '#2a6aea'; // BLue
      return
    };
    if (this.score >= 90) {
      this.grade = 'A'
      this.color = '#2037f8'; // Dark blue
      return
    };
    if (this.score >= 80) {
      this.grade = 'B'
      this.color = '#32CD32'; // Green
      return
    };
    if (this.score >= 70) {
      this.grade = 'C'
      this.color = '#FFA500'; // Orange
      return
    };
    if (this.score >= 60) {
      this.grade = 'D'
      this.color = '#FF0000'; // Red
      return
    };
    if (this.score >= 50) {
      this.grade = 'E'
      this.color = '#808080'// Grey
      return
    };
  }

}
