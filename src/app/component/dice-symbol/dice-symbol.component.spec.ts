import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DiceSymbolComponent } from './dice-symbol.component';

describe('DiceSymbolComponent', () => {
  let component: DiceSymbolComponent;
  let fixture: ComponentFixture<DiceSymbolComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DiceSymbolComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiceSymbolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
