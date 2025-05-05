import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // ✅ import CommonModule
import { PokemonService } from '../../services/pokemon.service';

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule], // ✅ enable *ngFor, *ngIf, etc.
  templateUrl: './pokemon-list.component.html',
  styleUrls: ['./pokemon-list.component.css']
})
export class PokemonListComponent implements OnInit {
  pokemonList: any[] = [];
  selectedPokemon: any = null;

  constructor(private pokemonService: PokemonService) {}

  ngOnInit(): void {
    this.pokemonService.getAllPokemon().subscribe(data => {
      this.pokemonList = data;
    });
  }

  selectPokemon(pokemon: any): void {
    this.selectedPokemon = pokemon;
  }

  closePopup(): void {
    this.selectedPokemon = null;
  }
}
