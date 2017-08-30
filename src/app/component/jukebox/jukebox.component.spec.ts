import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JukeboxComponent } from './jukebox.component';

describe('JukeboxComponent', () => {
  let component: JukeboxComponent;
  let fixture: ComponentFixture<JukeboxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JukeboxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JukeboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
