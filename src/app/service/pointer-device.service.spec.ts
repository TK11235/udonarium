import { TestBed, inject } from '@angular/core/testing';

import { PointerDeviceService } from './pointer-device.service';

describe('PointerDeviceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PointerDeviceService]
    });
  });

  it('should ...', inject([PointerDeviceService], (service: PointerDeviceService) => {
    expect(service).toBeTruthy();
  }));
});
