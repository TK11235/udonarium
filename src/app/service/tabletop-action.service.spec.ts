import { TestBed } from '@angular/core/testing';

import { TabletopActionService } from './tabletop-action.service';

describe('TabletopActionService', () => {
  let service: TabletopActionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TabletopActionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
