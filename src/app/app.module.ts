import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BadgeComponent } from 'component/badge/badge.component';
import { CardStackListComponent } from 'component/card-stack-list/card-stack-list.component';
import { CardStackComponent } from 'component/card-stack/card-stack.component';
import { CardComponent } from 'component/card/card.component';
import { ChatMessageComponent } from 'component/chat-message/chat-message.component';
import { ChatPaletteComponent } from 'component/chat-palette/chat-palette.component';
import { ChatTabSettingComponent } from 'component/chat-tab-setting/chat-tab-setting.component';
import { ChatTabComponent } from 'component/chat-tab/chat-tab.component';
import { ChatWindowComponent } from 'component/chat-window/chat-window.component';
import { ContextMenuComponent } from 'component/context-menu/context-menu.component';
import { DiceSymbolComponent } from 'component/dice-symbol/dice-symbol.component';
import { FileSelecterComponent } from 'component/file-selecter/file-selecter.component';
import { FileStorageComponent } from 'component/file-storage/file-storage.component';
import { GameCharacterGeneratorComponent } from 'component/game-character-generator/game-character-generator.component';
import { GameCharacterSheetComponent } from 'component/game-character-sheet/game-character-sheet.component';
import { GameCharacterComponent } from 'component/game-character/game-character.component';
import { GameDataElementComponent } from 'component/game-data-element/game-data-element.component';
import { GameObjectInventoryComponent } from 'component/game-object-inventory/game-object-inventory.component';
import { GameTableMaskComponent } from 'component/game-table-mask/game-table-mask.component';
import { GameTableSettingComponent } from 'component/game-table-setting/game-table-setting.component';
import { GameTableComponent } from 'component/game-table/game-table.component';
import { JukeboxComponent } from 'component/jukebox/jukebox.component';
import { LobbyComponent } from 'component/lobby/lobby.component';
import { ModalComponent } from 'component/modal/modal.component';
import { NetworkIndicatorComponent } from 'component/network-indicator/network-indicator.component';
import { OverviewPanelComponent } from 'component/overview-panel/overview-panel.component';
import { PasswordCheckComponent } from 'component/password-check/password-check.component';
import { PeerCursorComponent } from 'component/peer-cursor/peer-cursor.component';
import { PeerMenuComponent } from 'component/peer-menu/peer-menu.component';
import { RoomSettingComponent } from 'component/room-setting/room-setting.component';
import { TerrainComponent } from 'component/terrain/terrain.component';
import { TextNoteComponent } from 'component/text-note/text-note.component';
import { TextViewComponent } from 'component/text-view/text-view.component';
import { UIPanelComponent } from 'component/ui-panel/ui-panel.component';
import { DraggableDirective } from 'directive/draggable.directive';
import { MovableDirective } from 'directive/movable.directive';
import { ResizableDirective } from 'directive/resizable.directive';
import { RotableDirective } from 'directive/rotable.directive';
import { TooltipDirective } from 'directive/tooltip.directive';
import { SafePipe } from 'pipe/safe.pipe';

import { AppConfigService } from 'service/app-config.service';
import { ChatMessageService } from 'service/chat-message.service';
import { ContextMenuService } from 'service/context-menu.service';
import { GameObjectInventoryService } from 'service/game-object-inventory.service';
import { ModalService } from 'service/modal.service';
import { PanelService } from 'service/panel.service';
import { PointerDeviceService } from 'service/pointer-device.service';
import { TabletopService } from 'service/tabletop.service';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent,
    BadgeComponent,
    CardComponent,
    CardStackComponent,
    CardStackListComponent,
    ChatMessageComponent,
    ChatPaletteComponent,
    ChatTabComponent,
    ChatTabSettingComponent,
    ChatWindowComponent,
    ContextMenuComponent,
    FileSelecterComponent,
    FileStorageComponent,
    GameCharacterGeneratorComponent,
    GameCharacterSheetComponent,
    GameCharacterComponent,
    GameDataElementComponent,
    GameObjectInventoryComponent,
    GameTableMaskComponent,
    GameTableSettingComponent,
    GameTableComponent,
    JukeboxComponent,
    LobbyComponent,
    ModalComponent,
    OverviewPanelComponent,
    PasswordCheckComponent,
    PeerMenuComponent,
    RoomSettingComponent,
    UIPanelComponent,
    SafePipe,
    ChatPaletteComponent,
    TextViewComponent,
    TerrainComponent,
    PeerCursorComponent,
    TextNoteComponent,
    MovableDirective,
    RotableDirective,
    NetworkIndicatorComponent,
    DiceSymbolComponent,
    TooltipDirective,
    DraggableDirective,
    ResizableDirective,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule
  ],
  providers: [
    AppConfigService,
    ChatMessageService,
    ContextMenuService,
    ModalService,
    GameObjectInventoryService,
    PanelService,
    PointerDeviceService,
    TabletopService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
