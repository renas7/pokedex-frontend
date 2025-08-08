// pokemon-form.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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

  types: {id:number; name:string}[] = [];
  abilitiesList: {id:number; name:string}[] = [];
  eggGroups: {id:number; name:string}[] = [];
  pokemonList: {id:number; name:string; number?:number}[] = []; // for evolutions

  form = this.fb.group({
    // basic
    name: ['', Validators.required],
    number: [null, Validators.required],
    species: [''],
    height: [null],
    weight: [null],
    generation: [1],
    base_experience: [0],
    capture_rate: [0],
    hatch_time: [null],
    base_friendship: [null],
    gender_male: [null],
    gender_female: [null],

    // relations
    type_ids: this.fb.control<number[]>([]),
    abilities: this.fb.control<number[]>([]),       // <— array of ability IDs
    egg_group_ids: this.fb.control<number[]>([]),

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

  ngOnInit() {
    this.http.get<any[]>('http://localhost:3000/types').subscribe(d => this.types = d);
    this.http.get<any[]>('http://localhost:3000/abilities').subscribe(d => this.abilitiesList = d);
    this.http.get<any[]>('http://localhost:3000/egg-groups').subscribe(d => this.eggGroups = d);
    this.http.get<any[]>('http://localhost:3000/pokemon/basic').subscribe(d => this.pokemonList = d);

    this.addDescription(); // start with 1 row
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
      to_pokemon_id: [null, Validators.required],
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

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Coerce multi-selects to numbers (Angular often gives strings)
    const v = this.form.value as any;
    const payload = {
      ...v,
      type_ids: (v.type_ids || []).map((x: any) => Number(x)),
      abilities: (v.abilities || []).map((x: any) => Number(x)),
      egg_group_ids: (v.egg_group_ids || []).map((x: any) => Number(x)),
      // stats already matches the controller: {hp, attack, ...}
      // evolutions are [{to_pokemon_id, method, level}] — controller should use pokemonId as from_pokemon_id
    };

    this.http.post('http://localhost:3000/pokemon', payload).subscribe({
      next: () => {
        alert('Pokémon created!');
        this.form.reset({
          generation: 1,
          base_experience: 0,
          capture_rate: 0,
          stats: { hp:0, attack:0, defense:0, sp_atk:0, sp_def:0, speed:0 },
          type_ids: [],
          abilities: [],
          egg_group_ids: []
        });
        this.descriptionsFA.clear(); this.addDescription();
        this.evolutionsFA.clear();
        this.formsFA.clear();
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.detail || err?.error?.error || 'Failed to create Pokémon');
      }
    });
  }
}
