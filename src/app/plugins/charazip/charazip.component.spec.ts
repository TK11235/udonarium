import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CharazipComponent } from './charazip.component';

describe('CharazipComponent', () => {
  let component: CharazipComponent;
  let fixture: ComponentFixture<CharazipComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CharazipComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CharazipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
