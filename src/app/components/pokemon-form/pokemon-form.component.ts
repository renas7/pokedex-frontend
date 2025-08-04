import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-your-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pokemon-form.component.html',
  styleUrls: ['./pokemon-form.component.css']
})


export class PokemonFormComponent implements OnInit {
  pokemon = {
    name: '',
    number: 0,
    species: '',
    height: 0,
    weight: 0,
    types: [],
    abilities: '',
    base_experience: 0,
    capture_rate: 0,
    type_ids: [] as number[]
  };

  availableTypes: { id: number, name: string }[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
      this.fetchTypes();
    }

  fetchTypes() {
    this.http.get<{ id: number; name: string }[]>('http://localhost:3000/types')
      .subscribe(data => {
        this.availableTypes = data;
      });
  }

  submitForm() {
    this.http.post('http://localhost:3000/pokemon', this.pokemon)
      .subscribe(() => {
        alert('Pokémon added successfully!');
        this.pokemon = {
          name: '',
          number: 0,
          species: '',
          height: 0,
          weight: 0,
          type_ids: [],
          types: [],
          abilities: '',
          base_experience: 0,
          capture_rate: 0
        };
      });
  }
}
