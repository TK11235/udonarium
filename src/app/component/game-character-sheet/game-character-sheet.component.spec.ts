import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GameCharacterSheetComponent } from './game-character-sheet.component';

describe('GameCharacterSheetComponent', () => {
  let component: GameCharacterSheetComponent;
  let fixture: ComponentFixture<GameCharacterSheetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GameCharacterSheetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameCharacterSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
