import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';

import { FileArchiver } from '@udonarium/core/file-storage/file-archiver';
import { ImageFile } from '@udonarium/core/file-storage/image-file';
import { ImageStorage } from '@udonarium/core/file-storage/image-storage';
import { ImageTagList } from '@udonarium/image-tag-list';
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
    return ImageTagList.instance
      .getTags(this.searchWords)
      .map(imageTag => ImageStorage.instance.get(imageTag.imageIdentifier))
      .filter(image => image);
  }

  selectedIdentifier: string = '';
  get selectedImageTag(): ImageTag { return ImageTagList.instance.getTag(this.selectedIdentifier); }
  get selectedTag(): string { return this.selectedImageTag ? this.selectedImageTag.tag : ''; }
  editTag: string = '';
  get hasEdited(): boolean { return this.editTag !== this.selectedTag; }

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
    EventSystem.call('SELECT_FILE', { fileIdentifier: file.identifier }, Network.peerId);

    this.selectedIdentifier = file.identifier;
    this.editTag = this.selectedTag;
  }

  changeTag() {
    if (this.selectedImageTag) {
      this.selectedImageTag.tag = this.editTag;
      return;
    }
    const imageTag = ImageTag.create(this.selectedIdentifier, this.editTag);
    ImageTagList.instance.add(imageTag);
  }
}
