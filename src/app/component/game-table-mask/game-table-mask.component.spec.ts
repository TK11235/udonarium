import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GameTableMaskComponent } from './game-table-mask.component';

describe('GameTableMaskComponent', () => {
  let component: GameTableMaskComponent;
  let fixture: ComponentFixture<GameTableMaskComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GameTableMaskComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameTableMaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
