import { AfterViewInit, Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { PointerDeviceService, PointerCoordinate } from '../../service/pointer-device.service';
import { EventSystem } from '../../class/core/system/system';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { PeerCursor } from '../../class/peer-cursor';

@Component({
  selector: 'peer-cursor, [peer-cursor]',
  templateUrl: './peer-cursor.component.html',
  styleUrls: ['./peer-cursor.component.css']
})
export class PeerCursorComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('cursor') cursorElementRef: ElementRef;
  @ViewChild('opacity') opacityElementRef: ElementRef;
  @Input() cursor: PeerCursor = PeerCursor.myCursor;

  get iconUrl(): string { return this.cursor.image.url; }
  get name(): string { return this.cursor.name }

  private cursorElement: HTMLElement = null;
  private opacityElement: HTMLElement = null;
  private fadeOutTimer: NodeJS.Timer = null;

  constructor(
    private elementRef: ElementRef,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnInit() {
    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        if (event.data.identifier !== this.cursor.identifier) return;
        this.setPosition(this.cursor.posX, this.cursor.posY, this.cursor.posZ);
        this.resetFadeOut();
      });
  }

  ngAfterViewInit() {
    this.cursorElement = this.cursorElementRef.nativeElement;
    this.opacityElement = this.opacityElementRef.nativeElement;
    this.setPosition(this.cursor.posX, this.cursor.posY, this.cursor.posZ);
    this.resetFadeOut();
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  private resetFadeOut() {
    this.opacityElement.style.opacity = '1.0';
    clearTimeout(this.fadeOutTimer);
    this.fadeOutTimer = setTimeout(() => {
      this.opacityElement.style.opacity = '0.0';
    }, 3000);
  }

  private setPosition(x: number, y: number, z: number) {
    this.cursorElement.style.transform = 'translateX(' + x + 'px) translateY(' + y + 'px) translateZ(' + z + 'px)';
  }
}
