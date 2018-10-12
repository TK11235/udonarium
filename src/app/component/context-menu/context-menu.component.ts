import { AfterViewInit, Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { ContextMenuService } from 'service/context-menu.service';

@Component({
  selector: 'context-menu',
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.css'],
  /*
  providers: [
    ContextMenuService,
  ]
  */
})
export class ContextMenuComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('draggablePanel') draggablePanel: ElementRef;

  @Input() set left(left: number) { this.contextMenuService.position.x = left; }
  @Input() set top(top: number) { this.contextMenuService.position.y = top; }

  get left() { return this.contextMenuService.position.x; }
  get top() { return this.contextMenuService.position.y; }

  private preLeft: number = 0
  private preTop: number = 0;
  private preWidth: number = 100;
  private preHeight: number = 100;

  private isFullScreen: boolean = false;

  private $draggablePanelElement: JQuery;
  private $scrollablePanelElement: JQuery;

  private callbackOnScrollablePanelMouseDown: any = null;
  private callbackOnDraggablePanelMouseDown: any = null;
  private callbackOnOutsideClick: any = null;
  constructor(
    public contextMenuService: ContextMenuService
  ) { }

  ngOnInit() {

  }

  ngAfterViewInit() {
    // TODO ウィンドウタイトルって下側のほうがいい？ 
    this.$draggablePanelElement = $(this.draggablePanel.nativeElement);

    //this.$draggablePanelElement.draggable({ containment: 'body', cancel: 'input,textarea,button,select,option,span', stack: '.draggable-panel', opacity: 0.7 });
    //this.$draggablePanelElement.resizable({ handles: 'all', minHeight: 100, minWidth: 100 });

    this.callbackOnScrollablePanelMouseDown = (e) => this.onScrollablePanelMouseDown(e);
    this.callbackOnDraggablePanelMouseDown = (e) => this.onDraggablePanelMouseDown(e);
    this.callbackOnOutsideClick = (e) => this.onOutsideClick(e);

    this.draggablePanel.nativeElement.addEventListener('mousedown', this.callbackOnDraggablePanelMouseDown, false);
    document.body.addEventListener('mousedown', this.callbackOnOutsideClick, true);

    this.preLeft = this.left;
    this.preTop = this.top;

    this.setForeground();
    this.adjustPosition();
  }

  ngOnDestroy() {
    this.draggablePanel.nativeElement.removeEventListener('mousedown', this.callbackOnDraggablePanelMouseDown, false);
    document.body.removeEventListener('mousedown', this.callbackOnOutsideClick, true);
    this.callbackOnScrollablePanelMouseDown = null;
    this.callbackOnDraggablePanelMouseDown = null;
    this.callbackOnOutsideClick = null;
  }

  private onScrollablePanelMouseDown(e: MouseEvent) {

  }

  private onDraggablePanelMouseDown(e: MouseEvent) {
    console.log('onDraggablePanelMouseDown');
    this.setForeground();
  }

  //@HostListener('document:mousedown', ['$event'])
  private onOutsideClick(event) {
    if (!$(event.target).closest(this.$draggablePanelElement).length) {
      this.close();
    }
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: Event) {
    console.log('onContextMenu');
    e.stopPropagation();
    e.preventDefault();
  }

  private setForeground() {
    let $stacks: JQuery = $('.draggable-panel')
    let topZIndex: number = 0;
    let bottomZindex: number = 99999;
    $stacks.each(function () {
      let zIndex = parseInt($(this).css('zIndex'));
      if (topZIndex < zIndex) topZIndex = zIndex;
      if (zIndex < bottomZindex) bottomZindex = zIndex;
    });
    $stacks.each(function () {
      $(this).css('zIndex', parseInt($(this).css('zIndex')) - bottomZindex);
    });
    this.$draggablePanelElement.css('zIndex', topZIndex + 1);
  }

  private adjustPosition() {
    let $panel = $(this.draggablePanel.nativeElement);

    let offsetLeft = $panel.offset().left;
    let offsetTop = $panel.offset().top;

    if (window.innerWidth < offsetLeft + $panel.outerWidth()) {
      offsetLeft -= (offsetLeft + $panel.outerWidth()) - window.innerWidth;
    }
    if (window.innerHeight < offsetTop + $panel.outerHeight()) {
      offsetTop -= (offsetTop + $panel.outerHeight()) - window.innerHeight;
    }

    if (offsetLeft < 0) {
      offsetLeft = 0;
    }
    if (offsetTop < 0) {
      offsetTop = 0;
    }

    $panel.offset({ left: offsetLeft, top: offsetTop });

    setTimeout(() => {
      this.left = offsetLeft;
      this.top = offsetTop;
    }, 0);
  }

  doAction(func: Function) {
    console.log('ContextMenu action');
    if (func) func();
    this.close();
  }

  close() {
    if (this.contextMenuService) this.contextMenuService.close();
  }
}

ContextMenuService.UIPanelComponentClass = ContextMenuComponent;
