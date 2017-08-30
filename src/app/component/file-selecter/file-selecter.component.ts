import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, AfterViewInit } from '@angular/core';

import { PanelService } from '../../service/panel.service';
import { ModalService } from '../../service/modal.service';
import { FileStorage } from '../../class/core/file-storage/file-storage';
import { ImageFile } from '../../class/core/file-storage/image-file';
import { Network, EventSystem } from '../../class/core/system/system';

@Component({
  selector: 'file-selector',
  templateUrl: './file-selecter.component.html',
  styleUrls: ['./file-selecter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileSelecterComponent implements OnInit, OnDestroy, AfterViewInit {

  fileStorageService = FileStorage.instance;
  constructor(
    //private fileStorageService: FileStorageService,
    private changeDetector: ChangeDetectorRef,
    private panelService: PanelService,
    private modalService: ModalService
  ) { }

  ngOnInit() {
    this.modalService.title = this.panelService.title = 'ファイル一覧';
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
    this.modalService.resolve(file.identifier);
  }
}
