import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';

import { AudioFile } from '@udonarium/core/file-storage/audio-file';
import { AudioPlayer, VolumeType } from '@udonarium/core/file-storage/audio-player';
import { AudioStorage } from '@udonarium/core/file-storage/audio-storage';
import { FileArchiver } from '@udonarium/core/file-storage/file-archiver';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { EventSystem } from '@udonarium/core/system/system';
import { Jukebox } from '@udonarium/Jukebox';

import { ModalService } from 'service/modal.service';
import { PanelService } from 'service/panel.service';

@Component({
  selector: 'app-jukebox',
  templateUrl: './jukebox.component.html',
  styleUrls: ['./jukebox.component.css']
})
export class JukeboxComponent implements OnInit, OnDestroy {

  get volume(): number { return AudioPlayer.volume; }
  set volume(volume: number) { AudioPlayer.volume = volume; }

  get auditionVolume(): number { return AudioPlayer.auditionVolume; }
  set auditionVolume(auditionVolume: number) { AudioPlayer.auditionVolume = auditionVolume; }

  get audios(): AudioFile[] { return AudioStorage.instance.audios.filter(audio => !audio.isHidden); }
  get jukebox(): Jukebox { return ObjectStore.instance.get<Jukebox>('Jukebox'); }

  private auditionPlayer: AudioPlayer = new AudioPlayer();
  private lazyUpdateTimer: NodeJS.Timer = null;

  constructor(
    private modalService: ModalService,
    private panelService: PanelService,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    this.modalService.title = this.panelService.title = 'ジュークボックス'
    this.auditionPlayer.volumeType = VolumeType.AUDITION;
    EventSystem.register(this)
      .on('*', event => {
        if (event.eventName.startsWith('FILE_')) this.lazyNgZoneUpdate();
      });
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
    this.stop();
  }

  play(audio: AudioFile) {
    this.auditionPlayer.play(audio);
  }

  stop() {
    this.auditionPlayer.stop();
  }

  playBGM(audio: AudioFile) {
    this.jukebox.play(audio.identifier, true);
  }

  stopBGM(audio: AudioFile) {
    if (this.jukebox.audio === audio) this.jukebox.stop();
  }

  handleFileSelect(event: Event) {
    let files = (<HTMLInputElement>event.target).files;
    if (files.length) FileArchiver.instance.load(files);
  }

  private lazyNgZoneUpdate() {
    if (this.lazyUpdateTimer !== null) return;
    this.lazyUpdateTimer = setTimeout(() => {
      this.lazyUpdateTimer = null;
      this.ngZone.run(() => { });
    }, 100);
  }
}
