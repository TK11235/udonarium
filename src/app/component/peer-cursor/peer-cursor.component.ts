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
  get isMine(): boolean { return this.cursor.isMine; }

  private cursorElement: HTMLElement = null;
  private opacityElement: HTMLElement = null;
  private fadeOutTimer: NodeJS.Timer = null;

  private updateInterval: NodeJS.Timer = null;
  private callcack: any = (e) => this.onMouseMove(e);

  private _x: number = 0;
  private _y: number = 0;

  constructor(
    private elementRef: ElementRef,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnInit() {
    if (!this.isMine) {
      EventSystem.register(this)
        .on('UPDATE_GAME_OBJECT', -1000, event => {
          if (event.data.identifier !== this.cursor.identifier) return;
          this.setPosition(this.cursor.posX, this.cursor.posY, this.cursor.posZ);
          this.resetFadeOut();
        });
    }
  }

  ngAfterViewInit() {
    if (this.isMine) {
      document.body.addEventListener('mousemove', this.callcack);
      document.body.addEventListener('touchmove', this.callcack);
    } else {
      this.cursorElement = this.cursorElementRef.nativeElement;
      this.opacityElement = this.opacityElementRef.nativeElement;
      this.setPosition(this.cursor.posX, this.cursor.posY, this.cursor.posZ);
      this.resetFadeOut();
    }
  }

  ngOnDestroy() {
    document.body.removeEventListener('mousemove', this.callcack);
    document.body.removeEventListener('touchmove', this.callcack);
    EventSystem.unregister(this);
  }

  private onMouseMove(e: any) {
    let x = e.touches ? e.changedTouches[0].pageX : e.pageX;
    let y = e.touches ? e.changedTouches[0].pageY : e.pageY;
    if (x === this._x && y === this._y) return;
    this._x = x;
    this._y = y;
    if (!this.updateInterval) {
      this.updateInterval = setTimeout(() => {
        this.updateInterval = null;
        this.calcLocalCoordinate(this._x, this._y, e.target);
      }, 66);
    }
  }

  private calcLocalCoordinate(x: number, y: number, target: HTMLElement) {
    let isTerrain = true;
    let node: HTMLElement = target;
    let dragArea = document.getElementById('app-game-table');

    while (node) {
      if (node === dragArea) break;
      node = node.parentElement;
    }
    if (node == null) isTerrain = false;

    let coordinate: PointerCoordinate = { x: x, y: y, z: 0 };
    if (!isTerrain) {
      coordinate = PointerDeviceService.convertToLocal(coordinate, dragArea);
      coordinate.z = 0;
    } else {
      coordinate = PointerDeviceService.convertLocalToLocal(coordinate, target, dragArea);
    }

    this.cursor.posX = coordinate.x;
    this.cursor.posY = coordinate.y;
    this.cursor.posZ = coordinate.z;
  }

  private findDragAreaElement(parent: HTMLElement): HTMLElement {
    if (parent.tagName === 'DIV') {
      return parent;
    } else if (parent.tagName !== 'BODY') {
      return this.findDragAreaElement(parent.parentElement);
    }
    return null;
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
