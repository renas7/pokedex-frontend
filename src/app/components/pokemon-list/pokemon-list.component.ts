import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pokemon } from '../../models/pokemon.model';
import { PokemonService } from '../../services/pokemon.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pokemon-list.component.html',
  styleUrls: ['./pokemon-list.component.css']
})


export class PokemonListComponent implements OnInit, OnDestroy {
  pokemons: Pokemon[] = [];
  selectedPokemon: Pokemon | null = null;

  constructor(private pokemonService: PokemonService, private router: Router) {}

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

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    if (!this.selectedPokemon) return;            // only if popup is open
    if (e.key === 'Escape' || e.key === 'Esc') {  // old browsers use 'Esc'
      // Optional guard: ignore ESC inside inputs/textareas
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || t?.isContentEditable) return;

      e.preventDefault();
      this.closePopup();
    }
  }

  ngOnDestroy(): void {
    // nothing to clean up when using HostListener
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

  formatNumber(num: number): string {
    return num.toString().padStart(4, '0');
  }

  goToDetail(id: number) {
    this.router.navigate(['/pokemon', id]);
  }

  getTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      Grass: '#78c850ff',
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

  getBgTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      // Grass: '#78c85080',
      // Poison: '#a040a080',
      // Fire: '#F0803080',
      // Water: '#6890F080',
      // Flying: '#A890F080',
      // Bug: '#A8B82080',
      // Normal: '#A8A87880',
      // Electric: '#F8D03080',
      // Ground: '#E0C06880',
      // Fairy: '#EE99AC80',
      // Fighting: '#C0302880',
      // Psychic: '#F8588880',
      // Rock: '#B8A03880',
      // Ghost: '#70589880',
      // Ice: '#98D8D880',
      // Dragon: '#7038F880',
      // Dark: '#70584880',
      // Steel: '#B8B8D080',
      Grass:    '#bbe3a7',
      Poison:   '#cf9fcf',
      Fire:     '#f7bf97',
      Water:    '#b3c7f7',
      Flying:   '#d3c7f7',
      Bug:      '#d3db8f',
      Normal:   '#d3d3bb',
      Electric: '#fbe797',
      Ground:   '#efdfb3',
      Fairy:    '#f6ccd5',
      Fighting: '#df9793',
      Psychic:  '#fbabc3',
      Rock:     '#dbcf9b',
      Ghost:    '#b7abcb',
      Ice:      '#cbebeb',
      Dragon:   '#b79bfb',
      Dark:     '#b7aba3',
      Steel:    '#dbdbe7'
    };
    return colors[type] || '#A8A87880';
  }
}
