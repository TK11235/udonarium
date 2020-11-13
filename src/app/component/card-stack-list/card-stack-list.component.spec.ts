import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CardStackListComponent } from './card-stack-list.component';

describe('CardStackListComponent', () => {
  let component: CardStackListComponent;
  let fixture: ComponentFixture<CardStackListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CardStackListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardStackListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
