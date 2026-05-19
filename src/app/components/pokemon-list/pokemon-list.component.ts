import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pokemon } from '../../models/pokemon.model';
import { PokemonService } from '../../services/pokemon.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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
      this.filteredPokemons = data;

      // Restore scroll after data loads
      const saved = sessionStorage.getItem('scrollPosition');
      if (saved) {
        setTimeout(() => {
          window.scrollTo(0, Number(saved));
          sessionStorage.removeItem('scrollPosition');
        }, 0);
      }
    });
  }

  readonly GAME_ORDER = [
    'Red', 'Blue', 'Yellow',
    'Gold', 'Silver', 'Crystal',
    'Ruby', 'Sapphire', 'Emerald',
    'FireRed', 'LeafGreen',
    'Diamond', 'Pearl', 'Platinum',
    'HeartGold', 'SoulSilver',
    'Black', 'White',
    'Black 2', 'White 2',
    'X', 'Y',
    'Omega Ruby', 'Alpha Sapphire',
    'Sun', 'Moon',
    'Ultra Sun', 'Ultra Moon',
    'Lets Go Pikachu', 'Lets Go Eevee',
    'Sword', 'Shield',
    'Brilliant Diamond', 'Shining Pearl',
    'Legends Arceus',
    'Scarlet', 'Violet'
  ];

  getGameOrderIndex(label: string): number {
    const firstGame = label.split('/')[0];
    const index = this.GAME_ORDER.indexOf(firstGame);
    return index === -1 ? 999 : index;
  }

  openPopup(pokemon: Pokemon): void {
    const sortedDescriptions = [...(pokemon.descriptions || [])].sort(
      (a, b) => this.getGameOrderIndex(a.game) - this.getGameOrderIndex(b.game)
    );

    this.selectedPokemon = {
      ...pokemon,
      descriptions: sortedDescriptions
    };

    if (sortedDescriptions.length > 0) {
      this.selectedGameVersion = sortedDescriptions[0].game;
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

  formatImageName(name: string): string { //ADD HERE POKEMON THAT NAME WONT MATCH WITH PICTURE
    const normalized = name.toLowerCase();
    //NAME YOU GOT vs NAME YOU WANT
    if (normalized === 'nidoran-f') return 'Nidoran';
    if (normalized === 'nidoran-m') return 'Nidoran';
    if (normalized === 'farfetchd') return 'Farfetch\'d';
    if (normalized === 'mr-mime') return 'Mr. Mime';
    if (normalized === 'ho-oh') return 'Ho-Oh';

    return name;
  }

  goToDetail(id: number) {
    sessionStorage.setItem('scrollPosition', String(window.scrollY));
    this.router.navigate(['/pokemon', id]);
  }

  //Seach and filter
  filteredPokemons: Pokemon[] = [];

  searchTerm = '';
  selectedTypes: string[] = [];
  selectedGeneration = 'All';

  typeOptions: string[] = [
    // 'Any', 'None',
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
    'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
  ];

  toggleTypeFilter(type: string, checked: boolean): void {
    if (checked) {
      if (!this.selectedTypes.includes(type)) {
        this.selectedTypes.push(type);
      }
    } else {
      this.selectedTypes = this.selectedTypes.filter(t => t !== type);
    }

    this.applyFilters();
  }

  isTypeSelected(type: string): boolean {
    return this.selectedTypes.includes(type);
  }

  generationOptions: string[] = [
    'All', '1', '2', '3', '4', '5', '6', '7', '8', '9'
  ];

  applyFilters(): void {
    const term = this.searchTerm.toLowerCase().trim();

    this.filteredPokemons = this.pokemons.filter(poke => {
      const matchesSearch =
        poke.name.toLowerCase().includes(term) ||
        String(poke.number).includes(term);

      const pokeTypes = poke.types || [];

      const wantsNoSecondary = this.selectedTypes.includes('None');
      const selectedRealTypes = this.selectedTypes.filter(type => type !== 'None');

      const matchesSelectedTypes =
        selectedRealTypes.length === 0 ||
        selectedRealTypes.every(type => pokeTypes.includes(type));

      const matchesNoSecondary =
        !wantsNoSecondary || pokeTypes.length === 1;

      const matchesType =
        matchesSelectedTypes && matchesNoSecondary;

      const matchesGeneration =
        this.selectedGeneration === 'All' ||
        String(poke.generation) === this.selectedGeneration;

      return matchesSearch && matchesType && matchesGeneration;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedTypes = [];
    this.selectedGeneration = 'All';
    this.filteredPokemons = this.pokemons;
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
