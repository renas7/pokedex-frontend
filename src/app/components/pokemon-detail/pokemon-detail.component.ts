import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PokemonService } from '../../services/pokemon.service';
import { Pokemon } from '../../models/pokemon.model';

@Component({
  selector: 'app-pokemon-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pokemon-detail.component.html',
  styleUrls: ['./pokemon-detail.component.css']
})
export class PokemonDetailComponent implements OnInit {
  pokemon: Pokemon | null = null;

  constructor(
    private route: ActivatedRoute,
    private pokemonService: PokemonService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.pokemonService.getPokemonById(id).subscribe(poke => {
        this.pokemon = poke;
      });
    });
  }

  formatNumber(num: number): string {
    return num.toString().padStart(4, '0');
  }

  getPreEvolutions() {
    return this.pokemon?.evolutions?.filter(e => e.to_pokemon_id === this.pokemon?.id) || [];
  }

  getPostEvolutions() {
    return this.pokemon?.evolutions?.filter(e => e.from_pokemon_id === this.pokemon?.id) || [];
  }
}
