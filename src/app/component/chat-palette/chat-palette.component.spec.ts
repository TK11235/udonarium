import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatPaletteComponent } from './chat-palette.component';

describe('ChatPaletteComponent', () => {
  let component: ChatPaletteComponent;
  let fixture: ComponentFixture<ChatPaletteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChatPaletteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatPaletteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
