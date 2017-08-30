import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordCheckComponent } from './password-check.component';

describe('PasswordCheckComponent', () => {
  let component: PasswordCheckComponent;
  let fixture: ComponentFixture<PasswordCheckComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PasswordCheckComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PasswordCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
