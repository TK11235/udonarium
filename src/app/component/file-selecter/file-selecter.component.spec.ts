import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FileSelecterComponent } from './file-selecter.component';

describe('FileSelecterComponent', () => {
  let component: FileSelecterComponent;
  let fixture: ComponentFixture<FileSelecterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FileSelecterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FileSelecterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
