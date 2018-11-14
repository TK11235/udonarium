import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContextSubMenuComponent } from './context-sub-menu.component';

describe('ContextSubMenuComponent', () => {
  let component: ContextSubMenuComponent;
  let fixture: ComponentFixture<ContextSubMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContextSubMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContextSubMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
