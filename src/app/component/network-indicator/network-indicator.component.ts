import { AfterViewInit, Component, ElementRef, OnDestroy } from '@angular/core';

import { EventSystem, Network } from '@udonarium/core/system';

@Component({
  selector: 'network-indicator',
  templateUrl: './network-indicator.component.html',
  styleUrls: ['./network-indicator.component.css']
})
export class NetworkIndicatorComponent implements AfterViewInit, OnDestroy {
  private timer: NodeJS.Timer = null;
  private needRepeat = false;

  constructor(private elementRef: ElementRef) { }

  ngAfterViewInit() {
    let repeatFunc = () => {
      if (this.needRepeat) {
        this.timer = setTimeout(repeatFunc, 650);
        this.needRepeat = false;
      } else {
        this.timer = null;
        this.elementRef.nativeElement.style.display = 'none';
      }
    };

    EventSystem.register(this)
      .on('*', event => {
        if (this.needRepeat || Network.bandwidthUsage < 3 * 1024) return;
        if (this.timer === null) {
          this.elementRef.nativeElement.style.display = 'block';
          this.timer = setTimeout(repeatFunc, 650);
        } else {
          this.needRepeat = true;
        }
      });
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }
}
