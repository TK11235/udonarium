import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GameTableSettingComponent } from './game-table-setting.component';

describe('GameTableSettingComponent', () => {
  let component: GameTableSettingComponent;
  let fixture: ComponentFixture<GameTableSettingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GameTableSettingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameTableSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
