import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pokemon } from '../../models/pokemon.model';
import { PokemonService } from '../../services/pokemon.service';

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pokemon-list.component.html',
  styleUrls: ['./pokemon-list.component.css']
})
export class PokemonListComponent implements OnInit {
  pokemons: Pokemon[] = [];
  selectedPokemon: Pokemon | null = null; // 👈 Add this line

  constructor(private pokemonService: PokemonService) {}

  ngOnInit(): void {
    this.pokemonService.getAllPokemon().subscribe((data: Pokemon[]) => {
      this.pokemons = data;
    });
  }

  openPopup(pokemon: Pokemon): void {
    this.selectedPokemon = pokemon;
  // Auto-select the first game version if available
  if (pokemon.descriptions && pokemon.descriptions.length > 0) {
    this.selectedGameVersion = pokemon.descriptions[0].game;
  } else {
    this.selectedGameVersion = null;
  }
  }

  closePopup(): void {
    this.selectedPokemon = null;
    this.selectedGameVersion = null;
  }

  getDescriptionForGame(game: string): string {
    if (!this.selectedPokemon?.descriptions) return 'No description available';

    const desc = this.selectedPokemon.descriptions.find(d => d.game === game);
    return desc ? desc.text : 'No description available';
  }

  selectedGameVersion: string | null = null;

  selectGameVersion(version: string): void {
    this.selectedGameVersion = version;
  }

  getSelectedDescription(): { game: string; text: string } | null {
    if (!this.selectedPokemon?.descriptions || !this.selectedGameVersion) return null;

    return this.selectedPokemon.descriptions.find(
      desc => desc.game === this.selectedGameVersion
    ) || null;
  }

  getTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      Grass: '#78C850',
      Poison: '#A040A0',
      Fire: '#F08030',
      Water: '#6890F0',
      Flying: '#A890F0',
      Bug: '#A8B820',
      Normal: '#A8A878',
      Electric: '#F8D030',
      Ground: '#E0C068',
      Fairy: '#EE99AC',
      Fighting: '#C03028',
      Psychic: '#F85888',
      Rock: '#B8A038',
      Ghost: '#705898',
      Ice: '#98D8D8',
      Dragon: '#7038F8',
      Dark: '#705848',
      Steel: '#B8B8D0'
    };
    return colors[type] || '#A8A878';
  }
}
