import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, NgZone, Input, ViewChild, AfterViewInit, ElementRef, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

import { ModalService } from '../../service/modal.service';
import { PanelService, PanelOption } from '../../service/panel.service';
import { PointerDeviceService } from '../../service/pointer-device.service';

import { PeerCursor } from '../../class/peer-cursor';
import { Network, EventSystem } from '../../class/core/system/system';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { PeerContext } from '../../class/core/system/network/peer-context';

@Component({
  selector: 'room-setting',
  templateUrl: './room-setting.component.html',
  styleUrls: ['./room-setting.component.css'],
  //changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoomSettingComponent implements OnInit {
  peers: PeerContext[] = [];
  isReloading: boolean = false;

  roomName: string = 'ふつうの部屋';
  password: string = '';
  isPrivate: boolean = false;

  get peerId(): string { return Network.peerId; }
  get isConnected(): boolean {
    return Network.peerIds.length <= 1 ? false : true;
  }

  constructor(
    private ngZone: NgZone,
    private panelService: PanelService,
    private modalService: ModalService,
    private elementRef: ElementRef,
    private changeDetector: ChangeDetectorRef,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnInit() {
    this.modalService.title = this.panelService.title = 'ルーム作成'
    EventSystem.register(this);
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  createRoom() {
    let peerId = Network.peerContext ? Network.peerContext.id : PeerContext.generateId();
    Network.open(peerId, PeerContext.generateId(), this.roomName, this.isPrivate, this.password);
    PeerCursor.myCursor.peerId = Network.peerId;

    this.modalService.resolve();
  }
}