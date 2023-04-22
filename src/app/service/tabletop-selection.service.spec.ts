import { TestBed } from '@angular/core/testing';

import { TabletopSelectionService } from './tabletop-selection.service';

describe('TabletopSelectionService', () => {
  let service: TabletopSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TabletopSelectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
