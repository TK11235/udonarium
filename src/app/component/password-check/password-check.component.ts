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

  private targetPeerContexts: PeerContext[] = [];
  title: string = '';

  get peerId(): string { return Network.peerId; }
  get isConnected(): boolean {
    return Network.peerIds.length <= 1 ? false : true;
  }

  constructor(
    private panelService: PanelService,
    private modalService: ModalService
  ) {
    this.targetPeerContexts = modalService.option.peerContexts ?? [];
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
    if (this.targetPeerContexts.find(context => context.verifyPassword(this.password))) this.modalService.resolve(this.password);
    this.help = 'パスワードが違います';
  }
}