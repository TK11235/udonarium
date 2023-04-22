import {
  AfterViewInit,
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  ViewContainerRef
} from '@angular/core';
import { EventSystem } from '@udonarium/core/system';
import { TabletopObject } from '@udonarium/tabletop-object';
import { OverviewPanelComponent } from 'component/overview-panel/overview-panel.component';
import { ContextMenuService } from 'service/context-menu.service';
import { PointerDeviceService } from 'service/pointer-device.service';

@Directive({
  selector: '[appTooltip]'
})
export class TooltipDirective implements AfterViewInit, OnDestroy {
  private static activeTooltips: ComponentRef<OverviewPanelComponent>[] = [];

  @Input('appTooltip') tabletopObject: TabletopObject;

  private callbackOnMouseEnter = (e) => this.onMouseEnter(e);
  private callbackOnMouseLeave = (e) => this.onMouseLeave(e);
  private callbackOnMouseDown = (e) => this.onMouseDown(e);
  private callbackOnPick = (e) => this.ngZone.run(() => this.closeAll());

  private openTooltipTimer: NodeJS.Timer;
  private closeTooltipTimer: NodeJS.Timer;

  private tooltipComponentRef: ComponentRef<OverviewPanelComponent>

  constructor(
    private ngZone: NgZone,
    private viewContainerRef: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngAfterViewInit() {
    this.addEventListeners(this.viewContainerRef.element.nativeElement);
  }

  ngOnDestroy() {
    this.removeEventListeners(this.viewContainerRef.element.nativeElement);
    this.clearTimer();
    this.close();
  }

  private onMouseEnter(e: any) {
    this.clearTimer();
    if (!this.tooltipComponentRef) this.startOpenTimer();
  }

  private onMouseLeave(e: any) {
    this.clearTimer();
    if (this.tooltipComponentRef) this.startCloseTimer();
  }

  private onMouseDown(e: any) {
    if (!this.tooltipComponentRef) return;
    if (!this.tooltipComponentRef.location.nativeElement.contains(e.target)
      && !this.viewContainerRef.element.nativeElement.contains(e.target)) {
      this.ngZone.run(() => this.closeAll());
    }
  }

  private startOpenTimer() {
    let pointerX = this.pointerDeviceService.pointerX;
    let pointerY = this.pointerDeviceService.pointerY;

    this.openTooltipTimer = setTimeout(() => {
      this.openTooltipTimer = null;
      let magnitude = (pointerX - this.pointerDeviceService.pointerX) ** 2 + (pointerY - this.pointerDeviceService.pointerY) ** 2;
      if (4 < magnitude) {
        this.startOpenTimer();
      } else {
        this.ngZone.run(() => this.open());
      }
    }, 100);
  }

  private startCloseTimer() {
    this.closeTooltipTimer = setTimeout(() => {
      this.closeTooltipTimer = null;
      if (this.tooltipComponentRef && this.tooltipComponentRef.location.nativeElement.contains(document.activeElement)) {
        this.startCloseTimer();
      } else {
        this.ngZone.run(() => this.closeAll());
      }
    }, 400);
  }

  private clearTimer() {
    if (this.closeTooltipTimer) clearTimeout(this.closeTooltipTimer);
    if (this.openTooltipTimer) clearTimeout(this.openTooltipTimer);
    this.closeTooltipTimer = this.openTooltipTimer = null;
  }

  private open() {
    this.closeAll();
    if (this.pointerDeviceService.isDragging || this.pointerDeviceService.isTablePickGesture) return;

    let parentViewContainerRef = ContextMenuService.defaultParentViewContainerRef;

    const injector = parentViewContainerRef.injector;
    const panelComponentFactory = this.componentFactoryResolver.resolveComponentFactory(OverviewPanelComponent);

    this.tooltipComponentRef = parentViewContainerRef.createComponent(panelComponentFactory, parentViewContainerRef.length, injector);

    this.tooltipComponentRef.instance.tabletopObject = this.tabletopObject;
    this.tooltipComponentRef.instance.left = this.pointerDeviceService.pointerX;
    this.tooltipComponentRef.instance.top = this.pointerDeviceService.pointerY;

    this.addEventListeners(this.tooltipComponentRef.location.nativeElement);
    this.ngZone.runOutsideAngular(() => {
      document.body.addEventListener('touchstart', this.callbackOnMouseDown, true);
      document.body.addEventListener('mousedown', this.callbackOnMouseDown, true);
      document.addEventListener('pickstart', this.callbackOnPick, true);
      document.addEventListener('pickobject', this.callbackOnPick, true);
      document.addEventListener('pickregion', this.callbackOnPick, true);
    });

    EventSystem.register(this)
      .on(`UPDATE_GAME_OBJECT/identifier/${this.tabletopObject.identifier}`, event => {
        if (this.pointerDeviceService.isDragging) this.ngZone.run(() => this.closeAll());
      })
      .on('UPDATE_SELECTION', event => {
        if (this.pointerDeviceService.isDragging) this.ngZone.run(() => this.closeAll());
      })
      .on('DELETE_GAME_OBJECT', event => {
        if (this.tabletopObject && this.tabletopObject.identifier === event.data.identifier) this.closeAll();
      });

    this.tooltipComponentRef.onDestroy(() => {
      this.removeEventListeners(this.tooltipComponentRef.location.nativeElement);
      document.body.removeEventListener('touchstart', this.callbackOnMouseDown, true);
      document.body.removeEventListener('mousedown', this.callbackOnMouseDown, true);
      document.removeEventListener('pickstart', this.callbackOnPick, true);
      document.removeEventListener('pickobject', this.callbackOnPick, true);
      document.removeEventListener('pickregion', this.callbackOnPick, true);
      this.clearTimer();
      this.tooltipComponentRef = null;
      EventSystem.unregister(this);
    });
    TooltipDirective.activeTooltips.push(this.tooltipComponentRef);

    let onChanges = this.tooltipComponentRef.instance as OnChanges;
    if (onChanges?.ngOnChanges != null) {
      queueMicrotask(() => {
        if (this.tooltipComponentRef.instance) onChanges?.ngOnChanges({});
      });
    }
  }

  private close() {
    if (!this.tooltipComponentRef) return;
    let index = TooltipDirective.activeTooltips.indexOf(this.tooltipComponentRef);
    if (0 <= index) TooltipDirective.activeTooltips.splice(index, 1);

    this.tooltipComponentRef.destroy();
    this.tooltipComponentRef = null;
  }

  private closeAll() {
    TooltipDirective.activeTooltips.forEach(componentRef => componentRef.destroy());
    TooltipDirective.activeTooltips = [];
    this.close();
  }

  private addEventListeners(element: Element) {
    this.ngZone.runOutsideAngular(() => {
      element.addEventListener('mouseenter', this.callbackOnMouseEnter, false);
      element.addEventListener('mouseleave', this.callbackOnMouseLeave, false);
    });
  }

  private removeEventListeners(element: Element) {
    element.removeEventListener('mouseenter', this.callbackOnMouseEnter, false);
    element.removeEventListener('mouseleave', this.callbackOnMouseLeave, false);
  }
}
