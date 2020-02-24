import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { MainComponent } from "component/main/main.component";
import { CharazipComponent } from "./plugins/charazip/charazip.component";
import { DeckEditorComponent } from "./plugins/deck-editor/deck-editor.component";

const routes: Routes = [
  // { path: '', redirectTo: '/main', pathMatch: 'full' },
  { path: "", component: MainComponent },
  { path: "charazip", component: CharazipComponent },
  { path: "deck-editor", component: DeckEditorComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
