import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FileStorageComponent } from './file-storage.component';

describe('FileStorageComponent', () => {
  let component: FileStorageComponent;
  let fixture: ComponentFixture<FileStorageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FileStorageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FileStorageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
