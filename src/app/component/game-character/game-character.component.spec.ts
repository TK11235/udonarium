import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GameCharacterComponent } from './game-character.component';

describe('GameCharacterComponent', () => {
  let component: GameCharacterComponent;
  let fixture: ComponentFixture<GameCharacterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GameCharacterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameCharacterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
