import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteInventoryComponent } from './game-object-inventory.component';
//GameObjectInventoryComponent = NoteInventoryComponent;

describe('GameObjectInventoryComponent', () => {
  let component: NoteInventoryComponent;
  let fixture: ComponentFixture<NoteInventoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NoteInventoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoteInventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
