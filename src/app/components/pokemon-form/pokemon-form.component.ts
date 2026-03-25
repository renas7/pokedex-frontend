// pokemon-form.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { PokemonService } from '../../services/pokemon.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-pokemon-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pokemon-form.component.html',
  styleUrls: ['./pokemon-form.component.css']
})
export class PokemonFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(PokemonService);  // you already use HttpClient; we’ll use your service instead

  types: {id:number; name:string}[] = [];
  abilitiesList: {id:number; name:string}[] = [];
  eggGroups: {id:number; name:string}[] = [];
  pokemonList: {id:number; name:string; number?:number}[] = []; // for evolutions
  isEdit = false;
  currentId: number | null = null;


  form = this.fb.group({
    // basic
    name: ['', Validators.required],
    number: this.fb.control<number | null>(null, Validators.required),
    species: [''],
    height: this.fb.control<number | null>(null),
    weight: this.fb.control<number | null>(null),
    generation: [1],
    base_experience: [0],
    capture_rate: [0],
    hatch_time: [null],
    base_friendship: this.fb.control<number | null>(null),
    gender_male: this.fb.control<number | null>(null),
    gender_female: this.fb.control<number | null>(null),

    // TYPES: explicit slots
    type1_id: this.fb.control<number | null>(null, Validators.required),
    type2_id: this.fb.control<number | null>(null),
    

    // ABILITIES: normal + hidden
    normal_ability_ids: this.fb.control<number[]>([]),
    hidden_ability_id: this.fb.control<number | null>(null),

    // EGG GROUPS: max 2
    egg_group_ids: this.fb.control<number[]>([], [this.maxSelected(2)]),

    // relations
    //type_ids: this.fb.control<number[]>([]),
    //abilities: this.fb.control<number[]>([]),       // <— array of ability IDs
    //egg_group_ids: this.fb.control<number[]>([]),

    // stats as columns
    stats: this.fb.group({
      hp: [0, [Validators.required, Validators.min(1)]],
      attack: [0, [Validators.required, Validators.min(1)]],
      defense: [0, [Validators.required, Validators.min(1)]],
      sp_atk: [0, [Validators.required, Validators.min(1)]],
      sp_def: [0, [Validators.required, Validators.min(1)]],
      speed: [0, [Validators.required, Validators.min(1)]],
    }),

    // arrays
    descriptions: this.fb.array([] as any[]),       // [{game, text}]
    evolutions: this.fb.array([] as any[]),         // [{to_pokemon_id, method, level}]
    forms: this.fb.array([] as any[]),              // optional
  });

  get descriptionsFA(): FormArray { return this.form.get('descriptions') as FormArray; }
  get evolutionsFA(): FormArray { return this.form.get('evolutions') as FormArray; }
  get formsFA(): FormArray { return this.form.get('forms') as FormArray; }
  get type1Id(): number | null {
    return this.form.get('type1_id')?.value ?? null;
  }

  ngOnInit() {
    this.http.get<any[]>('http://localhost:3000/types').subscribe(d => this.types = d);
    this.http.get<any[]>('http://localhost:3000/abilities').subscribe(d => this.abilitiesList = d);
    this.http.get<any[]>('http://localhost:3000/egg-groups').subscribe(d => this.eggGroups = d);
    this.http.get<any[]>('http://localhost:3000/pokemon/basic').subscribe(d => this.pokemonList = d);

    this.form.valueChanges.subscribe(v => {
      if (v.type1_id && v.type2_id && v.type1_id === v.type2_id) {
        this.form.get('type2_id')?.setValue(null, { emitEvent: false });
      }
    });

    this.route.paramMap.subscribe(pm => {
      const idParam = pm.get('id');
      const id = idParam ? Number(idParam) : null;

      if (id && Number.isFinite(id) && id > 0) {
        this.isEdit = true;
        this.currentId = id;
        this.loadPokemonForEdit(id);
      } else {
        this.isEdit = false;
        this.currentId = null;
        // create mode: ensure clean state
        this.resetToCreateDefaults();
      }
    });
  }

  // helper: map type name to id from loaded list
  nameToTypeId(name: string | null): number | null {
    if (!name) return null;
    const t = this.types.find(x => x.name === name);
    return t ? t.id : null;
  }

  private resetToCreateDefaults() {
    this.form.reset({
      generation: 1,
      base_experience: 0,
      capture_rate: 0,
      stats: { hp:0, attack:0, defense:0, sp_atk:0, sp_def:0, speed:0 },
      type1_id: null,
      type2_id: null,
      normal_ability_ids: [],
      hidden_ability_id: null,
      egg_group_ids: []
    });

    this.descriptionsFA.clear();
    this.addDescription();
    this.evolutionsFA.clear();
    this.formsFA.clear();
  }

  private loadPokemonForEdit(id: number) {
    console.log('loadPokemonForEdit called with id:', id);
    this.resetToCreateDefaults();

    this.api.getPokemonById(id).subscribe((p: any) => {
      this.form.patchValue({
        name: p.name ?? '',
        number: p.number ?? null,
        species: p.species ?? '',
        height: p.height ?? null,
        weight: p.weight ?? null,
        generation: p.generation ?? 1,
        base_experience: p.base_experience ?? 0,
        capture_rate: p.capture_rate ?? 0,
        hatch_time: p.hatch_time ?? null,
        base_friendship: p.base_friendship ?? null,
        gender_male: p.gender_male ?? null,
        gender_female: p.gender_female ?? null,

        type1_id: this.nameToTypeId(p.types?.[0] ?? null),
        type2_id: this.nameToTypeId(p.types?.[1] ?? null),

        stats: p.stats || {}
      });

      this.descriptionsFA.clear();
      (p.descriptions || []).forEach((d: any) => {
        this.descriptionsFA.push(this.fb.group({
          game: [d.game ?? ''],
          text: [d.text ?? '']
        }));
      });
      if (this.descriptionsFA.length === 0) this.addDescription();

      this.evolutionsFA.clear();
      console.log('p.evolutions from API:', p.evolutions);
      (p.evolutions || [])
      .filter((e: any) => e.from_pokemon_id === this.currentId)
      .forEach((e: any) => {
        this.evolutionsFA.push(this.fb.group({
          to_pokemon_id: [e.to_pokemon_id ?? null],
          to_number: [null],
          method: [e.method || 'Level Up'],
          level: [e.level ?? null]
        }));
      });

      this.formsFA.clear();
      (p.forms || []).forEach((f: any) => {
        this.formsFA.push(this.fb.group({
          form_name: [f.form_name ?? ''],
          form_type: [f.form_type ?? '']
        }));
      });
    });
  }

  addDescription() {
    this.descriptionsFA.push(this.fb.group({
      game: [''],
      text: ['']
    }));
  }
  removeDescription(i: number) { this.descriptionsFA.removeAt(i); }

  addEvolution() {
    this.evolutionsFA.push(this.fb.group({
      to_pokemon_id: [null],         // optional now
      to_number: [null],             // NEW: allow number
      method: ['Level Up'],
      level: [null]
    }));
  }
  removeEvolution(i: number) { this.evolutionsFA.removeAt(i); }

  addFormRow() {
    this.formsFA.push(this.fb.group({
      form_name: [''],
      form_type: [''] // or region/etc. depending on your table
    }));
  }
  removeFormRow(i: number) { this.formsFA.removeAt(i); }

  // prevent selecting more than N in a native <select multiple>
  enforceMaxMulti(evt: Event, controlName: string, max: number) {
    const select = evt.target as HTMLSelectElement;
    const selected = Array.from(select.selectedOptions).map(o => Number(o.value));
    if (selected.length > max) {
      // revert UI to previous state
      const prev: number[] = this.form.get(controlName)?.value || [];
      for (const opt of Array.from(select.options)) {
        opt.selected = prev.includes(Number(opt.value));
      }
      return;
    }
    this.form.get(controlName)?.setValue(selected);
  }

  maxSelected(limit: number) {
    return (control: any) => {
      const val = control.value as any[];
      return Array.isArray(val) && val.length <= limit ? null : { maxSelected: { limit } };
    };
  }


  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue() as any;

    // 1) types → collapse to old array the backend expects
    const type_ids: number[] = [];
    if (v.type1_id) type_ids.push(Number(v.type1_id));
    if (v.type2_id) type_ids.push(Number(v.type2_id));

    // 2) abilities → old backend expects a flat array of IDs
    //    merge normal + hidden (dedup), hidden will be marked server-side using is_hidden
    // const abilitiesSet = new Set<number>(
    //   (v.normal_ability_ids || []).map((x: any) => Number(x))
    // );
    // if (v.hidden_ability_id) abilitiesSet.add(Number(v.hidden_ability_id));
    // const abilities = Array.from(abilitiesSet);
    const abilities = (v.normal_ability_ids || []).map((x: any) => Number(x));
    const hidden_ability_id = v.hidden_ability_id ? Number(v.hidden_ability_id) : null;

    // 3) egg groups → still an array, but ensure numbers and max 2
    const egg_group_ids = (v.egg_group_ids || [])
      .map((x: any) => Number(x))
      .slice(0, 2);

    // 4) evolutions → backend wants only to_pokemon_id.
    //    If user typed a number, resolve it on the client from pokemonList.
    const numberToId = (num: any): number | null => {
      const n = Number(num);
      if (!Number.isFinite(n)) return null;
      const found = this.pokemonList.find(p => p.number === n);
      return found ? found.id : null;
    };

    const evolutions = (v.evolutions || []).map((e: any) => {
      let toId = e.to_pokemon_id ? Number(e.to_pokemon_id) : null;
      if (!toId && e.to_number != null) {
        toId = numberToId(e.to_number);
      }
      return {
        to_pokemon_id: toId,                             // may be null; backend should skip nulls
        method: e.method || 'Level Up',
        level: e.level != null ? Number(e.level) : null
      };
    });

    // 5) build legacy-compatible payload
    const payload = {
      // basics
      name: v.name,
      number: Number(v.number),
      species: v.species,
      height: v.height,
      weight: v.weight,
      generation: v.generation,
      base_experience: v.base_experience,
      capture_rate: v.capture_rate,
      hatch_time: v.hatch_time,
      base_friendship: v.base_friendship,
      gender_male: v.gender_male,
      gender_female: v.gender_female,

      // legacy field names the backend already accepts
      type_ids,                 // [type1, type2?]
      abilities,                // only normal
      hidden_ability_id,        // hidden separeted
      egg_group_ids,            // up to 2

      // stats unchanged
      stats: {
        hp: Number(v.stats?.hp ?? 0),
        attack: Number(v.stats?.attack ?? 0),
        defense: Number(v.stats?.defense ?? 0),
        sp_atk: Number(v.stats?.sp_atk ?? 0),
        sp_def: Number(v.stats?.sp_def ?? 0),
        speed: Number(v.stats?.speed ?? 0),
      },

      // descriptions unchanged
      descriptions: (v.descriptions || []).map((d: any) => ({
        game: d.game || '',
        text: d.text || ''
      })),

      // evolutions (skip rows with no resolvable target)
      evolutions: evolutions.filter((e: any) => !!e.to_pokemon_id),

      // forms passthrough
      forms: (v.forms || []).map((f: any) => ({
        form_name: f.form_name || '',
        form_type: f.form_type || ''
      }))
    };

    // 6) send it
    // this.http.post('http://localhost:3000/pokemon', payload).subscribe({
    //   next: () => {
    //     alert('Pokémon created!');
    //     this.form.reset({
    //       generation: 1,
    //       base_experience: 0,
    //       capture_rate: 0,
    //       stats: { hp:0, attack:0, defense:0, sp_atk:0, sp_def:0, speed:0 },
    //       type1_id: null,
    //       type2_id: null,
    //       normal_ability_ids: [],
    //       hidden_ability_id: null,
    //       egg_group_ids: []
    //     });
    //     this.descriptionsFA.clear(); this.addDescription();
    //     this.evolutionsFA.clear();
    //     this.formsFA.clear();
    //   },
    //   error: (err) => {
    //     console.error('Create failed:', err);
    //     alert(err?.error?.detail || err?.error?.error || 'Failed to create Pokémon');
    //   }
    // });

    console.log('EDIT id:', this.currentId, 'number:', payload.number, 'name:', payload.name);

    const req$ = this.isEdit && this.currentId //Edit
      ? this.api.updatePokemon(this.currentId, payload)   // PUT
      : this.api.createPokemon(payload);                  // POST

    req$.subscribe({
      next: () => {
        alert(this.isEdit ? 'Pokémon updated!' : 'Pokémon created!');
        this.router.navigate(['/']); // back to list
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.detail || err?.error?.error || 'Save failed');
      }
    });


  }
}
