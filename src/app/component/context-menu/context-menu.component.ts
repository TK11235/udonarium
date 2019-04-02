import { AfterViewInit, Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { ContextMenuAction, ContextMenuService } from 'service/context-menu.service';

@Component({
  selector: 'context-menu',
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.css']
})
export class ContextMenuComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('root') rootElementRef: ElementRef;

  @Input() title: string = '';
  @Input() actions: ContextMenuAction[] = [];

  @Input() isSubmenu: boolean = false;

  parentMenu: ContextMenuAction;
  subMenu: ContextMenuAction[];

  showSubMenuTimer: NodeJS.Timer;
  hideSubMenuTimer: NodeJS.Timer;

  private callbackOnOutsideClick = (e) => this.onOutsideClick(e);

  constructor(
    private elementRef: ElementRef,
    public contextMenuService: ContextMenuService
  ) { }

  ngOnInit() {
    if (!this.isSubmenu) {
      this.title = this.contextMenuService.title;
      this.actions = this.contextMenuService.actions;
    }
  }

  ngAfterViewInit() {
    if (!this.isSubmenu) {
      this.setForeground();
      this.adjustPositionRoot();
      document.addEventListener('mousedown', this.callbackOnOutsideClick, false);
    } else {
      this.adjustPositionSub();
    }
  }

  ngOnDestroy() {
    document.removeEventListener('mousedown', this.callbackOnOutsideClick, false);
  }

  onOutsideClick(event) {
    if (!$(event.target).closest($(this.rootElementRef.nativeElement)).length) {
      this.close();
    }
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: Event) {
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
    $(this.rootElementRef.nativeElement).css('zIndex', topZIndex + 1);
  }

  private adjustPositionRoot() {
    let $panel = $(this.rootElementRef.nativeElement);

    $panel.offset({ left: this.contextMenuService.position.x, top: this.contextMenuService.position.y });

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
  }

  private adjustPositionSub() {
    let $parent = $(this.elementRef.nativeElement.parentElement);
    let $submenu = $(this.rootElementRef.nativeElement);
    let offsetLeft = $submenu.offset().left;
    let offsetTop = $submenu.offset().top;

    if (window.innerWidth < offsetLeft + $submenu.outerWidth()) {
      offsetLeft -= (offsetLeft + $submenu.outerWidth()) - $parent.offset().left;
      offsetLeft += 8;
    }
    if (window.innerHeight < offsetTop + $submenu.outerHeight()) {
      offsetTop -= (offsetTop + $submenu.outerHeight()) - window.innerHeight;
    }

    if (offsetLeft < 0) {
      offsetLeft = 0;
    }
    if (offsetTop < 0) {
      offsetTop = 0;
    }

    $submenu.offset({ left: offsetLeft, top: offsetTop });
  }

  doAction(action: ContextMenuAction) {
    this.showSubMenu(action);
    if (action.action != null) {
      action.action();
      this.close();
    }
  }

  showSubMenu(action: ContextMenuAction) {
    this.hideSubMenu();
    clearTimeout(this.showSubMenuTimer);
    if (action.subActions == null || action.subActions.length < 1) return;
    this.showSubMenuTimer = setTimeout(() => {
      this.parentMenu = action;
      this.subMenu = action.subActions;
      clearTimeout(this.hideSubMenuTimer);
    }, 250);
  }

  hideSubMenu() {
    clearTimeout(this.hideSubMenuTimer);
    this.hideSubMenuTimer = setTimeout(() => {
      this.subMenu = null;
    }, 1200);
  }

  close() {
    if (this.contextMenuService) this.contextMenuService.close();
  }
}

ContextMenuService.UIPanelComponentClass = ContextMenuComponent;
