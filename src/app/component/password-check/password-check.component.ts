import { Component, OnDestroy, OnInit } from '@angular/core';

import { EventSystem, Network } from '@udonarium/core/system';

import { ModalService } from 'service/modal.service';
import { PanelService } from 'service/panel.service';

@Component({
  selector: 'password-check',
  templateUrl: './password-check.component.html',
  styleUrls: ['./password-check.component.css']
})
export class PasswordCheckComponent implements OnInit, OnDestroy {
  password: string = '';
  help: string = '';

  private needPassword: string = '';

  get peerId(): string { return Network.peerId; }
  get isConnected(): boolean {
    return Network.peerIds.length <= 1 ? false : true;
  }

  constructor(
    private panelService: PanelService,
    private modalService: ModalService
  ) {
    this.needPassword = modalService.option.password ? modalService.option.password : '';
  }

  ngOnInit() {
    Promise.resolve().then(() => this.modalService.title = this.panelService.title = '密碼');
    EventSystem.register(this);
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  onInputChange(value: string) {
    this.help = '';
  }

  submit() {
    if (this.needPassword === this.password) this.modalService.resolve(this.password);
    this.help = '密碼錯誤';
  }
}