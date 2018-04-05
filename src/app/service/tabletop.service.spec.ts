import { TestBed, inject } from '@angular/core/testing';

import { TabletopService } from './tabletop.service';

describe('TabletopService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TabletopService]
    });
  });

  it('should be created', inject([TabletopService], (service: TabletopService) => {
    expect(service).toBeTruthy();
  }));
});
