import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GameCharacterGeneratorComponent } from './game-character-generator.component';

describe('GameCharacterGeneratorComponent', () => {
  let component: GameCharacterGeneratorComponent;
  let fixture: ComponentFixture<GameCharacterGeneratorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GameCharacterGeneratorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameCharacterGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
