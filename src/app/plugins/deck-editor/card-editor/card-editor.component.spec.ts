import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardEditorComponent } from './card-editor.component';

describe('CardEditorComponent', () => {
  let component: CardEditorComponent;
  let fixture: ComponentFixture<CardEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CardEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
