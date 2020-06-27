import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import { ModalService } from 'service/modal.service';

@Component({
  selector: 'modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'],
  animations: [
    trigger('flyInOut', [
      transition('void => *', [
        animate('100ms ease-out', keyframes([
          style({ transform: 'scale(0.8, 0.8)', opacity: '0', offset: 0 }),
          style({ transform: 'scale(1.0, 1.0)', opacity: '1.0', offset: 1.0 })
        ]))
      ]),
      transition('* => void', [
        animate(100, style({ transform: 'scale(0, 0)' }))
      ])
    ]),
    trigger('bgInOut', [
      state('in', style({ 'background-color': 'rgba(30, 30, 30, 0.4)' })),
      transition('void => *', [
        style({ 'background-color': 'rgba(30, 30, 30, 0.0)' }), animate(200)
      ]),
      transition('* => void', [
        animate(200, style({ 'background-color': 'rgba(30, 30, 30, 0.0)' }))
      ])
    ]),
  ]
})
export class ModalComponent {
  @ViewChild('content', { read: ViewContainerRef, static: true }) content: ViewContainerRef;

  constructor(
    public modalService: ModalService) { }

  clickBackground(event: MouseEvent) {
    if (event.target === event.currentTarget) this.resolve();
  }

  resolve() {
    this.modalService.resolve(null);
  }

  reject() {
    this.modalService.reject();
  }
}
