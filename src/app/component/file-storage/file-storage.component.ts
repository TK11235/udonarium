import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, AfterViewInit } from '@angular/core';

import { PanelService } from '../../service/panel.service';
import { ModalService } from '../../service/modal.service';
import { FileStorage } from '../../class/core/file-storage/file-storage';
import { ImageFile } from '../../class/core/file-storage/image-file';
import { Network, EventSystem } from '../../class/core/system/system';

@Component({
  selector: 'file-storage',
  templateUrl: './file-storage.component.html',
  styleUrls: ['./file-storage.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileStorageComponent implements OnInit, OnDestroy, AfterViewInit {

  fileStorageService = FileStorage.instance;
  constructor(
    //private fileStorageService: FileStorageService,
    private changeDetector: ChangeDetectorRef,
    private panelService: PanelService
  ) { }

  ngOnInit() {
    this.panelService.title = 'ファイル一覧';
  }

  ngAfterViewInit() {
    EventSystem.register(this).on('SYNCHRONIZE_FILE_LIST', 0, event => {
      if (event.sendFrom === Network.peerId) {
        console.log('FileStorageComponent changeDetector.markForCheck');
        this.changeDetector.markForCheck();
      }
    });
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  onSelectedFile(file: ImageFile) {
    console.log('onSelectedFile', file);
    EventSystem.call('SELECT_FILE', { fileIdentifier: file.identifier }, Network.peerId);
  }

}
