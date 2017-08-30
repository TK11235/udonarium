import { TestBed, inject } from '@angular/core/testing';

import { PanelService } from './panel.service';

describe('PanelService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PanelService]
    });
  });

  it('should ...', inject([PanelService], (service: PanelService) => {
    expect(service).toBeTruthy();
  }));
});
