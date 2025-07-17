import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PlayersCardComponent } from './players-card.component';

describe('PlayersCardComponent', () => {
  let component: PlayersCardComponent;
  let fixture: ComponentFixture<PlayersCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PlayersCardComponent],
      imports: []
    }).compileComponents();

    fixture = TestBed.createComponent(PlayersCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
