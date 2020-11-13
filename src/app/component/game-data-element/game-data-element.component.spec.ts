import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GameDataElementComponent } from './game-data-element.component';

describe('GameDataElementComponent', () => {
  let component: GameDataElementComponent;
  let fixture: ComponentFixture<GameDataElementComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GameDataElementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameDataElementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
