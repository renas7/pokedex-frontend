import { Routes } from '@angular/router';
import { PokemonListComponent } from './components/pokemon-list/pokemon-list.component';
import { PokemonDetailComponent } from './components/pokemon-detail/pokemon-detail.component';
import { PokemonFormComponent } from './components/pokemon-form/pokemon-form.component';

export const routes: Routes = [
  { path: '', component: PokemonListComponent },
  { path: 'pokemon/:id', component: PokemonDetailComponent },
  { path: 'add-pokemon', component: PokemonFormComponent }
];
