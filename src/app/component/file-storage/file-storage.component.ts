import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';

import { FileArchiver } from '@udonarium/core/file-storage/file-archiver';
import { ImageFile } from '@udonarium/core/file-storage/image-file';
import { ImageStorage } from '@udonarium/core/file-storage/image-storage';
import { EventSystem, Network } from '@udonarium/core/system';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { ImageTag } from '@udonarium/image-tag';

import { PanelService } from 'service/panel.service';

@Component({
  selector: 'file-storage',
  templateUrl: './file-storage.component.html',
  styleUrls: ['./file-storage.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileStorageComponent implements OnInit, OnDestroy, AfterViewInit {
  private inputTag: string = '';
  private selectedFile: ImageFile = null;

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

  constructor(
    private changeDetector: ChangeDetectorRef,
    private panelService: PanelService
  ) { }

  ngOnInit() {
    this.panelService.title = 'ファイル一覧';
  }

  ngAfterViewInit() {
    EventSystem.register(this).on('SYNCHRONIZE_FILE_LIST', event => {
      if (event.isSendFromSelf) {
        this.changeDetector.markForCheck();
      }
    }).on('ADD_IMAGE', event => {
      if (event.isSendFromSelf) {
        let imageIdentifier = event.data;
        let doubleCheckArray = ObjectStore.instance.getObjects<ImageTag>(ImageTag)
                     .filter(imageTag => imageTag.imageIdentifier == imageIdentifier)
                     .filter(imageTag => imageTag.tag == this.inputTag);
        if (doubleCheckArray.length) return;
        let imageTag: ImageTag = new ImageTag();
        imageTag.imageIdentifier = imageIdentifier;
        imageTag.tag = this.inputTag;
        imageTag.initialize();
      }
    });
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  handleFileSelect(event: Event) {
    let files = (<HTMLInputElement>event.target).files;
    if (files.length) FileArchiver.instance.load(files);
  }

  onSelectedFile(file: ImageFile) {
    console.log('onSelectedFile', file);
    this.selectedFile = file;
    EventSystem.call('SELECT_FILE', { fileIdentifier: file.identifier }, Network.peerId);
  }

  deleteTag() {
    if(!this.selectedFile) return;
    let imageFile = ImageStorage.instance.get(this.selectedFile.identifier);
    let imageTags = ObjectStore.instance.getObjects<ImageTag>(ImageTag)
                     .filter(imageTag => imageTag.imageIdentifier == imageFile.identifier);
    imageTags.forEach(imageTag => imageTag.destroy());
  }
}
