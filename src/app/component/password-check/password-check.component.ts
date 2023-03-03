import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { EventSystem, Network } from '@udonarium/core/system';
import { PeerContext } from '@udonarium/core/system/network/peer-context';

import { ModalService } from 'service/modal.service';
import { PanelService } from 'service/panel.service';

@Component({
  selector: 'password-check',
  templateUrl: './password-check.component.html',
  styleUrls: ['./password-check.component.css']
})
export class PasswordCheckComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('passwordInput', { static: true }) passwordInputElementRef: ElementRef<HTMLInputElement>;

  password: string = '';
  help: string = '';

  private targetPeers: PeerContext[] = [];
  title: string = '';

  get peerId(): string { return Network.peerId; }
  get isConnected(): boolean { return 0 < Network.peerIds.length; }

  constructor(
    private panelService: PanelService,
    private modalService: ModalService
  ) {
    this.targetPeers = modalService.option.peers ?? [];
    this.title = modalService.option.title ? modalService.option.title : '';
  }

  ngOnInit() {
    Promise.resolve().then(() => this.modalService.title = this.panelService.title = `パスワード ＜${this.title}＞`);
    EventSystem.register(this);
  }

  ngAfterViewInit() {
    this.passwordInputElementRef.nativeElement.focus();
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  onInputChange(value: string) {
    this.help = '';
  }

  submit() {
    if (this.targetPeers.find(peer => peer.verifyPassword(this.password))) this.modalService.resolve(this.password);
    this.help = 'パスワードが違います';
  }
}