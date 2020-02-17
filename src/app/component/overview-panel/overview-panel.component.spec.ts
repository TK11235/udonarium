import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OverviewPanelComponent } from './overview-panel.component';

describe('OverviewPanelComponent', () => {
  let component: OverviewPanelComponent;
  let fixture: ComponentFixture<OverviewPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OverviewPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OverviewPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
