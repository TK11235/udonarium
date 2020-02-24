import { Component, OnInit, Input } from "@angular/core";
import { Card } from "@udonarium/card";
import { ModalService } from "service/modal.service";
import { SaveDataService } from "service/save-data.service";
import { DataElement } from "@udonarium/data-element";
import { FileSelecterComponent } from "component/file-selecter/file-selecter.component";

@Component({
  selector: "app-card-editor",
  templateUrl: "./card-editor.component.html",
  styleUrls: ["./card-editor.component.css"]
})
export class CardEditorComponent implements OnInit {
  @Input() card: Card = null;
  isEdit: boolean = false;

  get isFront(): boolean {
    return this.card.isFront;
  }

  constructor(
    private saveDataService: SaveDataService,
    private modalService: ModalService
  ) {}

  ngOnInit() {}

  toggleEditMode(): void {
    this.isEdit = !this.isEdit;
  }

  save(): void {
    const element = this.card.getElement("name", this.card.commonDataElement);
    const objectName: string = element ? (element.value as string) : "";

    this.saveDataService.saveGameObject(this.card, "xml_" + objectName);
  }

  delete(): void {
    this.card.parent.removeChild(this.card);
    this.card.destroy();
  }

  up(): void {
    const parent = this.card.parent;
    const index: number = parent.children.indexOf(this.card);
    if (0 < index) {
      const prev = parent.children[index - 1];
      parent.insertBefore(this.card, prev);
    }
  }

  down(): void {
    const parent = this.card.parent;
    const index: number = parent.children.indexOf(this.card);
    if (index < parent.children.length - 1) {
      const next = parent.children[index + 1];
      parent.insertBefore(next, this.card);
    }
  }

  clone(): void {
    const cloneObject = this.card.clone();
    this.card.parent.insertBefore(cloneObject, this.card);
  }

  faceUp(): void {
    this.card.faceUp();
  }

  faceDown(): void {
    this.card.faceDown();
  }

  addDataElement(): void {
    if (this.card.detailDataElement) {
      const title = DataElement.create("見出し", "", {});
      const tag = DataElement.create("タグ", "", {});
      title.appendChild(tag);
      this.card.detailDataElement.appendChild(title);
    }
  }

  openModal(name: string = "", isAllowedEmpty: boolean = false): void {
    this.modalService
      .open<string>(FileSelecterComponent, { isAllowedEmpty })
      .then(value => {
        if (!this.card || !this.card.imageDataElement || !value) return;
        const element = this.card.imageDataElement.getFirstElementByName(name);
        if (!element) return;
        element.value = value;
      });
  }
}
