import { Component, Input, OnInit } from '@angular/core';

import { ModalService } from 'service/modal.service';
import { PanelService } from 'service/panel.service';

@Component({
  selector: 'text-view',
  templateUrl: './text-view.component.html',
  styleUrls: ['./text-view.component.css']
})
export class TextViewComponent implements OnInit {

  @Input() text: string = '';
  @Input() title: string = '';
  constructor(
    private panelService: PanelService,
    private modalService: ModalService
  ) { }

  ngOnInit() {
    this.panelService.title = this.title;
    if (this.modalService.option && this.modalService.option.title != null) {
      this.modalService.title = this.modalService.option.title ? this.modalService.option.title : '';
      this.text = this.modalService.option.text ? this.modalService.option.text : '';
    }
  }

}
