import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

import { ContextMenuAction, ContextMenuService } from 'service/context-menu.service';

@Component({
  selector: 'context-sub-menu',
  templateUrl: './context-sub-menu.component.html',
  styleUrls: ['./context-sub-menu.component.css']
})
export class ContextSubMenuComponent implements OnInit, AfterViewInit {
  @Input() title: string = '';
  @Input() subActions: ContextMenuAction[] = [];

  @ViewChild('root') rootElementRef: ElementRef;

  lastSelectMenu: ContextMenuAction;
  parentMenu: ContextMenuAction;
  subMenu: ContextMenuAction[];
  subMenuTimer: NodeJS.Timer;

  constructor(
    private elementRef: ElementRef,
    private contextMenuService: ContextMenuService
  ) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.adjustPosition();
  }

  doAction(action: ContextMenuAction) {
    console.log('ContextMenu action');
    if (action.action != null) {
      action.action();
      this.close();
    }
  }

  private adjustPosition() {
    console.log('adjustPosition subMenu');
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

  showSubMenu(action: ContextMenuAction) {
    this.lastSelectMenu = action;
    this.hideSubMenu();
    if (action.subActions == null || action.subActions.length < 1) return;
    this.parentMenu = action;
    this.subMenu = action.subActions;
    clearTimeout(this.subMenuTimer);
  }

  hideSubMenu() {
    clearTimeout(this.subMenuTimer);
    this.subMenuTimer = setTimeout(() => {
      this.subMenu = null;
    }, 1200);
  }

  close() {
    if (this.contextMenuService) this.contextMenuService.close();
  }
}
