import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GameTableComponent } from './game-table.component';

describe('GameTableComponent', () => {
  let component: GameTableComponent;
  let fixture: ComponentFixture<GameTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GameTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
