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

  generateEvolutionText(): string {
    if (!this.pokemon?.evolutions) return '';

    const evolutions = this.pokemon.evolutions;
    const currentId = this.pokemon.id;

    const pre = evolutions.find(e => e.to_pokemon_id === currentId);
    const post = evolutions.filter(e => e.from_pokemon_id === currentId);

    let text = '';

    if (pre) {
      text += `It evolves from <a href="/pokemon/${pre.from_pokemon_id}">${pre.from_pokemon_name}</a>`;
      if (pre.level) text += ` starting at level ${pre.level}`;
    }

    if (post.length > 0) {
      if (pre) {
        text += ' and evolves into ';
      } else {
        text += 'It evolves into ';
      }

      if (!pre) {
        let chainParts: string[] = [];
        let current = currentId;

        while (true) {
          const evo = evolutions.find(e => e.from_pokemon_id === current);
          if (!evo) break;

          let part = `<a href="/pokemon/${evo.to_pokemon_id}">${evo.to_pokemon_name}</a>`;
          if (evo.level) part += ` starting at level ${evo.level}`;

          chainParts.push(part);
          current = evo.to_pokemon_id;
        }

        text += chainParts.join(', which evolves into ');
      } else {
        const evo = post[0];
        text += `<a href="/pokemon/${evo.to_pokemon_id}">${evo.to_pokemon_name}</a>`;
        if (evo.level) text += ` starting at level ${evo.level}`;
      }
    }

    if (!post.length && pre) {
      const allToIds = evolutions.map(e => e.to_pokemon_id);
      const root = evolutions.find(e => !allToIds.includes(e.from_pokemon_id));
      const rootName = root ? root.from_pokemon_name : pre.from_pokemon_name;
      const rootLink = `<a href="/pokemon/${root?.from_pokemon_id}">${rootName}</a>`;

      text += `. It is the final form of ${rootLink}`;
    }

    if (!pre && !post.length) {
      text = `${this.pokemon.name} does not evolve.`;
    }

    return text + '.';
  }




}
