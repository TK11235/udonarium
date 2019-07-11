import { animate, keyframes, style, transition, trigger } from '@angular/animations';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ObjectNode } from '@udonarium/core/synchronize-object/object-node';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { EventSystem } from '@udonarium/core/system';
import { DataElement } from '@udonarium/data-element';
import { TabletopObject } from '@udonarium/tabletop-object';
import { GameObjectInventoryService } from 'service/game-object-inventory.service';
import { PointerDeviceService } from 'service/pointer-device.service';

@Component({
  selector: 'overview-panel',
  templateUrl: './overview-panel.component.html',
  styleUrls: ['./overview-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeInOut', [
      transition('void => *', [
        animate('100ms ease-out', keyframes([
          style({ opacity: 0, offset: 0 }),
          style({ opacity: 1, offset: 1.0 })
        ]))
      ]),
      transition('* => void', [
        animate('100ms ease-in', keyframes([
          style({ opacity: 1, offset: 0 }),
          style({ opacity: 0, offset: 1.0 })
        ]))
      ])
    ])
  ]
})
export class OverviewPanelComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('draggablePanel', { static: true }) draggablePanel: ElementRef;
  @Input() tabletopObject: TabletopObject = null;

  @Input() left: number = 0;
  @Input() top: number = 0;

  get imageUrl(): string { return this.tabletopObject && this.tabletopObject.imageFile ? this.tabletopObject.imageFile.url : ''; }
  get hasImage(): boolean { return 0 < this.imageUrl.length; }

  get inventoryDataElms(): DataElement[] { return this.tabletopObject ? this.getInventoryTags(this.tabletopObject) : []; }
  get dataElms(): DataElement[] { return this.tabletopObject && this.tabletopObject.detailDataElement ? this.tabletopObject.detailDataElement.children as DataElement[] : []; }
  get hasDataElms(): boolean { return 0 < this.dataElms.length; }

  get newLineString(): string { return this.inventoryService.newLineString; }
  get isPointerDragging(): boolean { return this.pointerDeviceService.isDragging; }

  get pointerEventsStyle(): any { return { 'is-pointer-events-auto': !this.isPointerDragging, 'pointer-events-none': this.isPointerDragging }; }

  isOpenImageView: boolean = false;

  private $panel: JQuery;

  private callbackOnScroll = (e) => this.onScroll(e);

  constructor(
    private ngZone: NgZone,
    private inventoryService: GameObjectInventoryService,
    private changeDetector: ChangeDetectorRef,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnInit() { }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.$panel = $(this.draggablePanel.nativeElement);
      $(this.draggablePanel.nativeElement).draggable({ containment: 'body', cancel: 'input,textarea,button,select,option,span', opacity: 0.7 });
      this.initPanelPosition();
      document.addEventListener('scroll', this.callbackOnScroll, false);
    });
    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        let object = ObjectStore.instance.get(event.data.identifier);
        if (!this.tabletopObject || !object || !(object instanceof ObjectNode)) return;
        if (this.tabletopObject === object || this.tabletopObject.contains(object)) {
          this.changeDetector.markForCheck();
        }
      })
      .on('SYNCHRONIZE_FILE_LIST', event => {
        this.changeDetector.markForCheck();
      })
      .on('UPDATE_FILE_RESOURE', -1000, event => {
        this.changeDetector.markForCheck();
      });
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
    document.removeEventListener('scroll', this.callbackOnScroll, false);
  }

  private onScroll(e: any) {
    this.adjustPosition();
  }

  private adjustPosition() {
    console.log('adjustPosition');
    let outerWidth = this.$panel.outerWidth();
    let outerHeight = this.$panel.outerHeight();

    let offsetLeft = this.$panel.offset().left;
    let offsetTop = this.$panel.offset().top;

    if (window.innerWidth < offsetLeft + outerWidth) {
      offsetLeft = window.innerWidth - outerWidth;
    }
    if (window.innerHeight < offsetTop + outerHeight) {
      offsetTop = window.innerHeight - outerHeight;
    }

    if (offsetLeft < 0) offsetLeft = 0;
    if (offsetTop < 0) offsetTop = 0;

    this.$panel.offset({ left: offsetLeft, top: offsetTop });
  }

  private initPanelPosition() {
    let outerWidth = this.$panel.outerWidth();
    let outerHeight = this.$panel.outerHeight();

    let offsetLeft = this.left + 100;
    let offsetTop = this.top - outerHeight - 50;

    let isCollideLeft = false;
    let isCollideTop = false;

    if (window.innerWidth < offsetLeft + outerWidth) {
      offsetLeft = window.innerWidth - outerWidth;
      isCollideLeft = true;
    }

    if (offsetTop <= 0) {
      offsetTop = 0;
      isCollideTop = true;
    }

    if (isCollideLeft && isCollideTop) {
      offsetLeft = this.left - outerWidth - 100;
    }

    if (offsetLeft < 0) offsetLeft = 0;
    if (offsetTop < 0) offsetTop = 0;

    this.$panel.offset({ left: offsetLeft, top: offsetTop });
  }

  chanageImageView(isOpen: boolean) {
    this.isOpenImageView = isOpen;
  }

  private getInventoryTags(gameObject: TabletopObject): DataElement[] {
    return this.inventoryService.tableInventory.dataElementMap.get(gameObject.identifier);
  }
}
