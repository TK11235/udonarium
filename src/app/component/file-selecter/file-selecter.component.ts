import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ImageFile } from '@udonarium/core/file-storage/image-file';
import { ImageStorage } from '@udonarium/core/file-storage/image-storage';
import { ImageTagStorage } from '@udonarium/core/file-storage/image-tag-storage';
import { EventSystem, Network } from '@udonarium/core/system';
import { ModalService } from 'service/modal.service';
import { PanelService } from 'service/panel.service';

@Component({
  selector: 'file-selector',
  templateUrl: './file-selecter.component.html',
  styleUrls: ['./file-selecter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileSelecterComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() isAllowedEmpty: boolean = false;
  get images(): ImageFile[] { return this.search(this.inputTag); }
  get empty(): ImageFile { return ImageFile.Empty; }
  inputTag: string = '';

  private search(tag: string): ImageFile[] {
    let imageFiles: ImageFile[] = [];
    if (tag === 'all') return ImageStorage.instance.images;
    for (let image of ImageStorage.instance.images) {
      let imageTag = ImageTagStorage.instance.get(image.identifier);
      if (!imageTag && tag === '') imageFiles.push(image);
      if (imageTag && tag === imageTag.tag) imageFiles.push(image);
    }
    return imageFiles;
  }

  constructor(
    private changeDetector: ChangeDetectorRef,
    private panelService: PanelService,
    private modalService: ModalService
  ) {
    this.isAllowedEmpty = this.modalService.option && this.modalService.option.isAllowedEmpty ? true : false;
  }

  ngOnInit() {
    this.modalService.title = this.panelService.title = 'ファイル一覧';
  }

  ngAfterViewInit() {
    EventSystem.register(this).on('SYNCHRONIZE_FILE_LIST', event => {
      if (event.isSendFromSelf) {
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
