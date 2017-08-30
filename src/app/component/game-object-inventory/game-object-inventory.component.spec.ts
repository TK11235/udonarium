import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GameObjectInventoryComponent } from './game-object-inventory.component';

describe('GameObjectInventoryComponent', () => {
  let component: GameObjectInventoryComponent;
  let fixture: ComponentFixture<GameObjectInventoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GameObjectInventoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameObjectInventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
