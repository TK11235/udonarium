import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkIndicatorComponent } from './network-indicator.component';

describe('NetworkIndicatorComponent', () => {
  let component: NetworkIndicatorComponent;
  let fixture: ComponentFixture<NetworkIndicatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NetworkIndicatorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
