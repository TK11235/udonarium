import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GameCharacterSheetComponent } from './game-character-sheet.component';

describe('GameCharacterSheetComponent', () => {
  let component: GameCharacterSheetComponent;
  let fixture: ComponentFixture<GameCharacterSheetComponent>;

  beforeEach(waitForAsync(() => {
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
