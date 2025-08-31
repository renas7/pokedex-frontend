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
        this.normalizeStats(poke);
        this.selectedFormIndex = -1;
        this.defenseMultipliers = this.computeDefenseMultipliers(this.getCurrentTypes());
        this.computeGender();
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

  // ======= Forms support =======
  selectedFormIndex: number = -1; // -1 = Default form

  selectForm(index: number) {
    this.selectedFormIndex = index;
    // If your forms can change typing, recompute effectiveness here
    // (uncomment if you store types per form):
    // const types = this.getCurrentTypes();
    // this.defenseMultipliers = this.computeDefenseMultipliers(types);
  }

  getFormLabel(form: any): string {
    // works with a string[] or object[]
    if (typeof form === 'string') return form;
    return form?.name || form?.label || 'Form';
  }

  getArtPath(): string {
    if (!this.pokemon) return '';
    // Default: 0001-Bulbasaur.png (your current naming)
    const base = `${this.formatNumber(this.pokemon.number)}-${this.pokemon.name}`;
    // If a form is selected AND you have per-form images, append suffix.
    const f = this.pokemon.forms?.[this.selectedFormIndex] ?? null;
    if (this.selectedFormIndex >= 0 && f) {
      // Try common properties first
      const imageName = (typeof f === 'string') ? `${base}-${f}` :
                        (f.imageName ? f.imageName : `${base}-${(f.name || f.label || 'Form')}`);
      return `assets/images/${imageName}.png`;
    }
    return `assets/images/${base}.png`;
  }

  // If forms can change types, return the active type set (fallback to base types)
  getCurrentTypes(): string[] {
    if (!this.pokemon) return [];
    const base = this.pokemon.types ?? [];
    const f = this.pokemon.forms?.[this.selectedFormIndex];
    // Example if your form object carries its own types:
    // if (this.selectedFormIndex >= 0 && f && Array.isArray((f as any).types)) {
    //   return (f as any).types as string[];
    // }
    return base;
  }

  // ======= Stats helpers =======
  // statOrder: string[] = ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'];
  // private STAT_MAX = 255; // scale bars to this (Pokémon base stats cap)

  // getStatValue(name: string): number {
  //   const s: any = this.pokemon?.stats;
  //   if (!s) return 0;

  //   // Supports object map (hp/attack/defense/sp_atk/sp_def/speed)
  //   const map: Record<string, string> = {
  //     'HP': 'hp', 'Attack': 'attack', 'Defense': 'defense',
  //     'Sp. Atk': 'sp_atk', 'Sp. Def': 'sp_def', 'Speed': 'speed'
  //   };
  //   if (!Array.isArray(s) && typeof s === 'object') {
  //     return Number(s[map[name]] ?? 0);
  //   }

  //   // Or array like [{name:'HP', value:45}, ...]
  //   if (Array.isArray(s)) {
  //     const row = s.find(x => (x.name || x.stat || '').toString().toLowerCase().replace(/\./g,'').trim()
  //                     === name.toLowerCase().replace(/\./g,'').trim());
  //     return Number((row?.value ?? row?.base ?? 0));
  //   }

  //   return 0;
  // }

  // statPercent(v: number): number {
  //   if (!v || v < 0) return 0;
  //   const pct = (v / this.STAT_MAX) * 100;
  //   return Math.max(0, Math.min(100, Math.round(pct)));
  // }

  // statTotal(): number {
  //   return this.statOrder.reduce((sum, key) => sum + this.getStatValue(key), 0);
  // }

  // ---- Stats state ----
  statsMap: Record<'HP'|'Attack'|'Defense'|'Sp. Atk'|'Sp. Def'|'Speed', number> | null = null;
  statOrder: Array<'HP'|'Attack'|'Defense'|'Sp. Atk'|'Sp. Def'|'Speed'> =
    ['HP','Attack','Defense','Sp. Atk','Sp. Def','Speed'];
  private readonly STAT_MAX = 255;

  // Turn whatever shape you have into a consistent map for the UI
  private normalizeStats(p: any): void {
    const s = p?.stats ?? p?.base_stats ?? null;
    if (!s) { this.statsMap = null; return; }

  // helper to assign with many possible keys
  const pick = (obj: any, ...keys: string[]) =>
    keys.map(k => obj?.[k]).find(v => typeof v === 'number') ?? 0;

  if (Array.isArray(s)) {
    // supports arrays like:
    // [{name:'HP', value:45}, {stat:{name:'special-attack'}, base_stat:65}, ...]
    const bag: Record<string, number> = {};
    for (const row of s) {
      const rawKey = (row.name || row.stat?.name || row.stat || '').toString().toLowerCase();
      const val = Number(row.value ?? row.base ?? row.base_stat ?? row.baseStat ?? 0);
      bag[rawKey] = val;
    }
    this.statsMap = {
      'HP': pick(bag, 'hp'),
      'Attack': pick(bag, 'attack'),
      'Defense': pick(bag, 'defense'),
      'Sp. Atk': pick(bag, 'sp. atk','sp_atk','spatk','special-attack'),
      'Sp. Def': pick(bag, 'sp. def','sp_def','spdef','special-defense'),
      'Speed': pick(bag, 'speed'),
    };
    return;
    }

    // object map like { hp, attack, defense, sp_atk, sp_def, speed } or PokeAPI-style keys
    const o = s as any;
    this.statsMap = {
      'HP': Number(o.hp ?? 0),
      'Attack': Number(o.attack ?? 0),
      'Defense': Number(o.defense ?? 0),
      'Sp. Atk': Number(o.sp_atk ?? o['special-attack'] ?? o.spAtk ?? 0),
      'Sp. Def': Number(o.sp_def ?? o['special-defense'] ?? o.spDef ?? 0),
      'Speed': Number(o.speed ?? 0),
    };
  }

  statPercent(v: number | undefined): number {
    const n = Math.max(0, Number(v ?? 0));
    return Math.min(100, Math.round((n / this.STAT_MAX) * 100));
  }

  statTotal(): number {
    if (!this.statsMap) return 0;
    return this.statOrder.reduce((sum, k) => sum + (this.statsMap?.[k] ?? 0), 0);
  }






  // ======= Type effectiveness (defense) =======
  // Call this after loading the pokemon
  typeList: string[] = [
    'Normal','Fire','Water','Electric','Grass','Ice',
    'Fighting','Poison','Ground','Flying','Psychic','Bug',
    'Rock','Ghost','Dragon','Dark','Steel','Fairy'
  ];

  defenseMultipliers: Record<string, number> = {};

  // Minimal chart: for each ATTACK type, which DEFENSE types are 2x / ½x / 0x
  private TYPE_EFFECT: Record<string, { double: string[]; half: string[]; zero: string[] }> = {
    Normal:  { double: [], half: ['Rock','Steel'], zero: ['Ghost'] },
    Fire:    { double: ['Grass','Ice','Bug','Steel'], half: ['Fire','Water','Rock','Dragon'], zero: [] },
    Water:   { double: ['Fire','Ground','Rock'], half: ['Water','Grass','Dragon'], zero: [] },
    Electric:{ double: ['Water','Flying'], half: ['Electric','Grass','Dragon'], zero: ['Ground'] },
    Grass:   { double: ['Water','Ground','Rock'], half: ['Fire','Grass','Poison','Flying','Bug','Dragon','Steel'], zero: [] },
    Ice:     { double: ['Grass','Ground','Flying','Dragon'], half: ['Fire','Water','Ice','Steel'], zero: [] },
    Fighting:{ double: ['Normal','Ice','Rock','Dark','Steel'], half: ['Poison','Flying','Psychic','Bug','Fairy'], zero: ['Ghost'] },
    Poison:  { double: ['Grass','Fairy'], half: ['Poison','Ground','Rock','Ghost'], zero: ['Steel'] },
    Ground:  { double: ['Fire','Electric','Poison','Rock','Steel'], half: ['Grass','Bug'], zero: ['Flying'] },
    Flying:  { double: ['Grass','Fighting','Bug'], half: ['Electric','Rock','Steel'], zero: [] },
    Psychic: { double: ['Fighting','Poison'], half: ['Psychic','Steel'], zero: ['Dark'] },
    Bug:     { double: ['Grass','Psychic','Dark'], half: ['Fire','Fighting','Poison','Flying','Ghost','Steel','Fairy'], zero: [] },
    Rock:    { double: ['Fire','Ice','Flying','Bug'], half: ['Fighting','Ground','Steel'], zero: [] },
    Ghost:   { double: ['Psychic','Ghost'], half: ['Dark'], zero: ['Normal'] },
    Dragon:  { double: ['Dragon'], half: ['Steel'], zero: ['Fairy'] },
    Dark:    { double: ['Psychic','Ghost'], half: ['Fighting','Dark','Fairy'], zero: [] },
    Steel:   { double: ['Ice','Rock','Fairy'], half: ['Fire','Water','Electric','Steel'], zero: [] },
    Fairy:   { double: ['Fighting','Dragon','Dark'], half: ['Fire','Poison','Steel'], zero: [] }
  };

  private effectMultiplier(attack: string, def: string): number {
    const eff = this.TYPE_EFFECT[attack];
    if (!eff) return 1;
    if (eff.zero.includes(def)) return 0;
    if (eff.double.includes(def)) return 2;
    if (eff.half.includes(def)) return 0.5;
    return 1;
  }

  private normalizeTypes(types: string[] | undefined): string[] {
    return (types ?? []).map(t => (t || '').toString().trim()).filter(Boolean) as string[];
  }

  computeDefenseMultipliers(defTypes: string[] | undefined): Record<string, number> {
    const defs = this.normalizeTypes(defTypes);
    const out: Record<string, number> = {};
    for (const atk of this.typeList) {
      let m = 1;
      for (const d of defs) {
        m *= this.effectMultiplier(atk, d);
        if (m === 0) break;
      }
      // clamp to allowed set (0, .25, .5, 1, 2, 4)
      const allowed = [0, 0.25, 0.5, 1, 2, 4];
      out[atk] = allowed.reduce((prev, curr) =>
        Math.abs(curr - m) < Math.abs(prev - m) ? curr : prev, 1);
    }
    return out;
  }

  formatMultiplier(n: number): string {
    if (n === 0) return '0×';
    if (n === 0.25) return '¼×';
    if (n === 0.5) return '½×';
    return `${n}×`;
  }


  // In PokemonDetailComponent:

  gender = { male: 0, female: 0, genderless: false };

  private toNum(v: any): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  private normalizePct(raw: any): number {
    const n = this.toNum(raw);
    return n > 1 ? n : n * 100; // accepts 0..1 or 0..100
  }

  private computeGender(): void {
    const p: any = this.pokemon;
    let male = this.normalizePct(p?.gender_male);
    let female = this.normalizePct(p?.gender_female);

    // derive missing side if only one is present
    if (p?.gender_female == null && p?.gender_male != null) female = Math.max(0, 100 - male);
    if (p?.gender_male == null && p?.gender_female != null) male = Math.max(0, 100 - female);

    // clamp & normalize
    male = Math.max(0, Math.min(100, male));
    female = Math.max(0, Math.min(100, female));
    const sum = male + female;
    if (sum > 100.0001) { male = (male / sum) * 100; female = 100 - male; }

    this.gender = {
      male: Math.round(male * 10) / 10,
      female: Math.round(female * 10) / 10,
      genderless: male === 0 && female === 0
    };
  }

  genderAriaLabel(): string {
    if (this.gender.genderless) return `${this.pokemon?.name} is genderless`;
    return `${this.pokemon?.name}: ${this.gender.male}% male, ${this.gender.female}% female`;
  }

}
