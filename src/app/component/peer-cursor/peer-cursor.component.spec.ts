import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PeerCursorComponent } from './peer-cursor.component';

describe('PeerCursorComponent', () => {
  let component: PeerCursorComponent;
  let fixture: ComponentFixture<PeerCursorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PeerCursorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PeerCursorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
