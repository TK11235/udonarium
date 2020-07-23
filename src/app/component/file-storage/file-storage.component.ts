import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';

import { FileArchiver } from '@udonarium/core/file-storage/file-archiver';
import { ImageContext, ImageFile } from '@udonarium/core/file-storage/image-file';
import { ImageStorage } from '@udonarium/core/file-storage/image-storage';
import { EventSystem, Network } from '@udonarium/core/system';

import { PanelService } from 'service/panel.service';
import { ImageTag } from '@udonarium/image-tag';

@Component({
  selector: 'file-storage',
  templateUrl: './file-storage.component.html',
  styleUrls: ['./file-storage.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileStorageComponent implements OnInit, OnDestroy, AfterViewInit {
  searchWord: string = '';
  imgUrl: string = "";
  private _searchWord: string;
  private _searchWords: string[];
  get searchWords(): string[] {
    if (this._searchWord !== this.searchWord) {
      this._searchWord = this.searchWord;
      this._searchWords = this.searchWord != null && 0 < this.searchWord.trim().length ? this.searchWord.trim().split(/\s+/) : [];
    }
    return this._searchWords;
  }

  get images(): ImageFile[] {
    if (this.searchWords.length < 1) return ImageStorage.instance.images;
    return ImageTag.searchImages(this.searchWords);
  }

  selectedFile: ImageFile = null;
  get isSelected(): boolean { return this.selectedFile != null; }
  get selectedImageTag(): ImageTag {
    if (!this.isSelected) return null;
    const imageTag = ImageTag.get(this.selectedFile.identifier);
    return imageTag ? imageTag : ImageTag.create(this.selectedFile.identifier);
  }
  get selectedTag(): string { return this.isSelected ? this.selectedImageTag.tag : ''; }
  set selectedTag(selectedTag: string) { if (this.isSelected) this.selectedImageTag.tag = selectedTag; }

  constructor(
    private changeDetector: ChangeDetectorRef,
    private panelService: PanelService
  ) { }

  ngOnInit() {
    this.panelService.title = '檔案列表';
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

  handleFileSelect(event: Event) {
    let files = (<HTMLInputElement>event.target).files;
    if (files.length) FileArchiver.instance.load(files);
  }
  uploadByUrl() {
    let file: ImageFile = null;
    let fileContext: ImageContext = null;
    fileContext = ImageFile.createEmpty(this.imgUrl).toContext();
    fileContext.name = this.imgUrl;
    fileContext.url = this.imgUrl;
    file = ImageStorage.instance.add(fileContext);
    this.imgUrl = '';
  }
  //REF:
  //https://github.com/zeteticl/udonarium/commit/235e33729c8f17387357da56e53864c52c4f72fa
  deleteFile(file: ImageFile) {
    console.log("deleteFile Target: " + file.identifier);
    ImageStorage.instance.delete(file.identifier);
  }

  onSelectedFile(file: ImageFile) {
    console.log('onSelectedFile', file);
    EventSystem.call('SELECT_FILE', { fileIdentifier: file.identifier }, Network.peerId);

    this.selectedFile = file;
  }
}
