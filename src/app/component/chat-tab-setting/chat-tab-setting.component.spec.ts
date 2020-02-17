import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatTabSettingComponent } from './chat-tab-setting.component';

describe('ChatTabSettingComponent', () => {
  let component: ChatTabSettingComponent;
  let fixture: ComponentFixture<ChatTabSettingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChatTabSettingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatTabSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
