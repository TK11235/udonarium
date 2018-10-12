import { Injectable, NgZone } from '@angular/core';

import { PointerDeviceService } from './pointer-device.service';

@Injectable()
export class TabletopService {
  dragAreaElement: HTMLElement = document.body;

  constructor(
    public ngZone: NgZone,
    public pointerDeviceService: PointerDeviceService,
  ) { }
}
