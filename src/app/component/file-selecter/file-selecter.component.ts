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
import { EventSystem, Network } from '@udonarium/core/system';
import { ModalService } from 'service/modal.service';
import { PanelService } from 'service/panel.service';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { ImageTag } from '@udonarium/image-tag';

@Component({
  selector: 'file-selector',
  templateUrl: './file-selecter.component.html',
  styleUrls: ['./file-selecter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileSelecterComponent implements OnInit, OnDestroy, AfterViewInit {
  private inputTag = '';

  @Input() isAllowedEmpty: boolean = false;
  get images(): ImageFile[] {
    if (this.inputTag == 'all') return ImageStorage.instance.images;
    let allImages = ImageStorage.instance.images;
    let searchIdentifiers = ObjectStore.instance.getObjects<ImageTag>(ImageTag)
                              .filter(imageTag => imageTag.tag == this.inputTag)
                              .map(imageTag => imageTag.imageIdentifier);
    let searchImages = allImages.filter(image => searchIdentifiers.includes(image.identifier));
    //タグを持っていない画像も表示する
    if (this.inputTag == '') {
      let identifiers = ObjectStore.instance.getObjects<ImageTag>(ImageTag)
                          .map(imageTag => imageTag.imageIdentifier);
      let noTagImages = allImages.filter(image => !identifiers.includes(image.identifier));
      searchImages = noTagImages.concat(searchImages);
    }
    return searchImages;
  }
  get empty(): ImageFile { return ImageFile.Empty; }

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
