import { animate, keyframes, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { PanelService } from 'service/panel.service';
import { PointerDeviceService } from 'service/pointer-device.service';

@Component({
  selector: 'ui-panel',
  templateUrl: './ui-panel.component.html',
  styleUrls: ['./ui-panel.component.css'],
  providers: [
    PanelService,
  ],
  animations: [
    trigger('flyInOut', [
      transition('void => *', [
        animate('100ms ease-out', keyframes([
          style({ transform: 'scale(0.8, 0.8)', opacity: '0', offset: 0 }),
          style({ transform: 'scale(1.0, 1.0)', opacity: '1', offset: 1.0 })
        ]))
      ]),
      transition('* => void', [
        animate(100, style({ transform: 'scale(0, 0)' }))
      ])
    ])
  ]
})
export class UIPanelComponent implements OnInit {
  @ViewChild('draggablePanel', { static: true }) draggablePanel: ElementRef;
  @ViewChild('scrollablePanel', { static: true }) scrollablePanel: ElementRef;
  @ViewChild('content', { read: ViewContainerRef, static: true }) content: ViewContainerRef;

  @Input() set title(title: string) { this.panelService.title = title; }
  @Input() set left(left: number) { this.panelService.left = left; }
  @Input() set top(top: number) { this.panelService.top = top; }
  @Input() set width(width: number) { this.panelService.width = width; }
  @Input() set height(height: number) { this.panelService.height = height; }

  get title(): string { return this.panelService.title; }
  get left() { return this.panelService.left; }
  get top() { return this.panelService.top; }
  get width() { return this.panelService.width; }
  get height() { return this.panelService.height; }

  private preLeft: number = 0
  private preTop: number = 0;
  private preWidth: number = 100;
  private preHeight: number = 100;

  private isFullScreen: boolean = false;

  private $draggablePanel: JQuery;

  get isPointerDragging(): boolean { return this.pointerDeviceService.isDragging; }

  constructor(
    public panelService: PanelService,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnInit() {
    this.panelService.scrollablePanel = this.scrollablePanel.nativeElement;
  }

  toggleFullScreen() {
    if (this.$draggablePanel.offset().left <= 0
      && this.$draggablePanel.offset().top <= 0
      && this.$draggablePanel.outerWidth() >= window.innerWidth
      && this.$draggablePanel.outerHeight() >= window.innerHeight) {
      this.isFullScreen = false;
    } else {
      this.isFullScreen = true;
    }

    if (this.isFullScreen) {
      this.preLeft = this.$draggablePanel.offset().left;
      this.preTop = this.$draggablePanel.offset().top;
      this.preWidth = this.$draggablePanel.outerWidth();
      this.preHeight = this.$draggablePanel.outerHeight();

      this.left = 0;
      this.top = 0;
      this.width = window.innerWidth;
      this.height = window.innerHeight;

      this.$draggablePanel.offset({ left: this.left, top: this.top });
      this.$draggablePanel.outerWidth(this.width);
      this.$draggablePanel.outerHeight(this.height);

      console.log(this.preWidth, this.width, window.innerWidth);

    } else {
      console.log(this.preWidth);

      this.left = this.preLeft;
      this.top = this.preTop;
      this.width = this.preWidth;
      this.height = this.preHeight;
    }
  }

  close() {
    if (this.panelService) this.panelService.close();
  }
}

PanelService.UIPanelComponentClass = UIPanelComponent;