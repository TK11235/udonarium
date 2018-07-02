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

@Component({
  selector: 'app-jukebox',
  templateUrl: './jukebox.component.html',
  styleUrls: ['./jukebox.component.css']
})
export class JukeboxComponent implements OnInit {

  get volume(): number { return AudioStorage.volume; }
  set volume(volume: number) { AudioStorage.volume = volume; }

  get auditionVolume(): number { return AudioStorage.auditionVolume; }
  set auditionVolume(auditionVolume: number) { AudioStorage.auditionVolume = auditionVolume; }
  
  get audios(): AudioFile[] { return AudioStorage.instance.audios; }
  get jukebox(): Jukebox { return ObjectStore.instance.get<Jukebox>('Jukebox'); }

  constructor(
    private modalService: ModalService,
    private panelService: PanelService
  ) { }

  ngOnInit() {
    this.modalService.title = this.panelService.title = 'ジュークボックス'
    EventSystem.register(this);
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  play(audio: AudioFile) {
    AudioStorage.instance.play(audio.identifier);
  }

  stop(audio: AudioFile) {
    AudioStorage.instance.stop(audio.identifier);
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
