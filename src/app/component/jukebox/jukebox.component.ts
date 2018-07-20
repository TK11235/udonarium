import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, NgZone, Input, ViewChild, AfterViewInit, ElementRef, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

import { ModalService } from '../../service/modal.service';
import { PanelService, PanelOption } from '../../service/panel.service';

import { AudioStorage } from '../../class/core/file-storage/audio-storage';
import { AudioFile } from '../../class/core/file-storage/audio-file';
import { Network, EventSystem } from '../../class/core/system/system';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';

import { Jukebox } from '../../class/Jukebox';
import { FileArchiver } from '../../class/core/file-storage/file-archiver';
import { AudioPlayer, VolumeType } from '../../class/core/file-storage/audio-player';

@Component({
  selector: 'app-jukebox',
  templateUrl: './jukebox.component.html',
  styleUrls: ['./jukebox.component.css']
})
export class JukeboxComponent implements OnInit {

  get volume(): number { return AudioPlayer.volume; }
  set volume(volume: number) { AudioPlayer.volume = volume; }

  get auditionVolume(): number { return AudioPlayer.auditionVolume; }
  set auditionVolume(auditionVolume: number) { AudioPlayer.auditionVolume = auditionVolume; }

  get audios(): AudioFile[] { return AudioStorage.instance.audios; }
  get jukebox(): Jukebox { return ObjectStore.instance.get<Jukebox>('Jukebox'); }

  private auditionPlayer: AudioPlayer = new AudioPlayer();

  constructor(
    private modalService: ModalService,
    private panelService: PanelService
  ) { }

  ngOnInit() {
    this.modalService.title = this.panelService.title = 'ジュークボックス'
    this.auditionPlayer.volumeType = VolumeType.AUDITION;
    EventSystem.register(this);
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
}
