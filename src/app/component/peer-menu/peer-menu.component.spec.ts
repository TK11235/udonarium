import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PeerMenuComponent } from './peer-menu.component';

describe('PeerMenuComponent', () => {
  let component: PeerMenuComponent;
  let fixture: ComponentFixture<PeerMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PeerMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PeerMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
