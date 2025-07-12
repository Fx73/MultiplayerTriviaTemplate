import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OptionsPage } from './options.page';

describe('OptionsPage', () => {
  let component: OptionsPage;
  let fixture: ComponentFixture<OptionsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OptionsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
