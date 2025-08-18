import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router, RouterModule } from '@angular/router';
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

  // === ADD: type color map ===
  private typeColor: Record<string, string> = {
    Normal:  '#A8A77A',
    Fire:    '#EE8130',
    Water:   '#6390F0',
    Electric:'#F7D02C',
    Grass:   '#7AC74C',
    Ice:     '#96D9D6',
    Fighting:'#C22E28',
    Poison:  '#A33EA1',
    Ground:  '#E2BF65',
    Flying:  '#A98FF3',
    Psychic: '#F95587',
    Bug:     '#A6B91A',
    Rock:    '#B6A136',
    Ghost:   '#735797',
    Dragon:  '#6F35FC',
    Dark:    '#705746',
    Steel:   '#B7B7CE',
    Fairy:   '#D685AD'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pokemonService: PokemonService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (!Number.isFinite(id) || id <= 0) {
        this.router.navigate(['/']);
        return;
      }
      this.pokemonService.getPokemonById(id).subscribe(poke => {
        this.pokemon = poke;
      });
    });
  }

  // === CHANGE: safer padding ===
  formatNumber(num: number | null | undefined): string {
    if (num === null || num === undefined) return '';
    return String(num).padStart(4, '0');
  }

  // === ADD: helper used by template for badge color ===
  getTypeColor(type: string): string {
    return this.typeColor[type] || '#999';
  }

  getPreEvolutions() {
    return this.pokemon?.evolutions?.filter(e => e.to_pokemon_id === this.pokemon?.id) || [];
  }

  getPostEvolutions() {
    return this.pokemon?.evolutions?.filter(e => e.from_pokemon_id === this.pokemon?.id) || [];
  }

  generateEvolutionText(): string {
    if (!this.pokemon?.evolutions?.length) return '';

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
        const chainParts: string[] = [];
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

    // ✅ Correct: find the root of THIS chain (walk backwards from current/pre)
    if (!post.length && pre) {
      let rootId = pre.from_pokemon_id;
      let rootName = pre.from_pokemon_name;

      // keep stepping back: X <- Y <- Z ... until no parent
      let step = evolutions.find(e => e.to_pokemon_id === rootId);
      while (step) {
        rootId = step.from_pokemon_id;
        rootName = step.from_pokemon_name;
        step = evolutions.find(e => e.to_pokemon_id === rootId);
      }

      text += `. It is the final form of <a href="/pokemon/${rootId}">${rootName}</a>`;
    }

    if (!pre && !post.length) {
      text = `${this.pokemon.name} does not evolve.`;
    }

    return text.endsWith('.') ? text : text + '.';
  }

  getBgTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      Grass: '#78c85080',
      Poison: '#a040a080',
      Fire: '#F0803080',
      Water: '#6890F080',
      Flying: '#A890F080',
      Bug: '#A8B82080',
      Normal: '#A8A87880',
      Electric: '#F8D03080',
      Ground: '#E0C06880',
      Fairy: '#EE99AC80',
      Fighting: '#C0302880',
      Psychic: '#F8588880',
      Rock: '#B8A03880',
      Ghost: '#70589880',
      Ice: '#98D8D880',
      Dragon: '#7038F880',
      Dark: '#70584880',
      Steel: '#B8B8D080'
    };
    return colors[type] || '#A8A87880';
  }

}
