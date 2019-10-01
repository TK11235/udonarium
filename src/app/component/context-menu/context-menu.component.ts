import { AfterViewInit, Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ContextMenuAction, ContextMenuService } from 'service/context-menu.service';

@Component({
  selector: 'context-menu',
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.css']
})
export class ContextMenuComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('root', { static: true }) rootElementRef: ElementRef<HTMLElement>;

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
    if (this.rootElementRef.nativeElement.contains(event.target) === false) {
      this.close();
    }
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: Event) {
    e.stopPropagation();
    e.preventDefault();
  }

  private adjustPositionRoot() {
    let panel: HTMLElement = this.rootElementRef.nativeElement;

    panel.style.left = this.contextMenuService.position.x + 'px';
    panel.style.top = this.contextMenuService.position.y + 'px';

    let offsetLeft = panel.offsetLeft;
    let offsetTop = panel.offsetTop;
    let offsetWidth = panel.offsetWidth;
    let offsetHeight = panel.offsetHeight;

    if (window.innerWidth < offsetLeft + offsetWidth) {
      offsetLeft -= (offsetLeft + offsetWidth) - window.innerWidth;
    }
    if (window.innerHeight < offsetTop + offsetHeight) {
      offsetTop -= (offsetTop + offsetHeight) - window.innerHeight;
    }

    if (offsetLeft < 0) {
      offsetLeft = 0;
    }
    if (offsetTop < 0) {
      offsetTop = 0;
    }

    panel.style.left = offsetLeft + 'px';
    panel.style.top = offsetTop + 'px';
  }

  private adjustPositionSub() {
    let parent: HTMLElement = this.elementRef.nativeElement.parentElement;
    let submenu: HTMLElement = this.rootElementRef.nativeElement;

    let offsetLeft = submenu.offsetLeft;
    let offsetTop = submenu.offsetTop;
    let offsetWidth = submenu.offsetWidth;
    let offsetHeight = submenu.offsetHeight;

    if (window.innerWidth < offsetLeft + offsetWidth) {
      offsetLeft -= (offsetLeft + offsetWidth) - parent.offsetLeft;
      offsetLeft += 8;
    }
    if (window.innerHeight < offsetTop + offsetHeight) {
      offsetTop -= (offsetTop + offsetHeight) - window.innerHeight;
    }

    if (offsetLeft < 0) {
      offsetLeft = 0;
    }
    if (offsetTop < 0) {
      offsetTop = 0;
    }

    submenu.style.left = offsetLeft + 'px';
    submenu.style.top = offsetTop + 'px';
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
