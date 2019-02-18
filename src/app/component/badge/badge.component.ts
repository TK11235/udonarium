import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'badge',
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.css'],
  animations: [
    trigger('bounce', [
      state('active', style({ transform: '' })),
      transition('* => active', [
        animate('600ms ease', keyframes([
          style({ transform: 'scale3d(0.5, 0.5, 0.5)', offset: 0 }),
          style({ transform: 'scale3d(2, 2, 2)', offset: 0.5 }),
          style({ transform: 'scale3d(0.75, 0.75, 0.75)', offset: 0.75 }),
          style({ transform: 'scale3d(1.125, 1.125, 1.125)', offset: 0.875 }),
          style({ transform: 'scale3d(1.0, 1.0, 1.0)', offset: 1.0 })
        ]))
      ])
    ])
  ]
})
export class BadgeComponent implements OnChanges {
  @Input() count: number = 0;
  animeState: string = 'active';

  ngOnChanges() {
    this.animeState = 'inactive';
    setTimeout(() => { this.animeState = 'active'; });
  }

  animationShuffleDone(event: any) {
    this.animeState = 'inactive';
  }

}
