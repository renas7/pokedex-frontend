import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pokemon } from '../models/pokemon.model';

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private apiUrl = 'http://localhost:3000/pokemon'; // backend route

  constructor(private http: HttpClient) {}

  getAllPokemon(): Observable<Pokemon[]> {
    return this.http.get<Pokemon[]>(this.apiUrl);
  }

  getPokemonById(id: number): Observable<Pokemon> {
    return this.http.get<Pokemon>(`http://localhost:3000/pokemon/${id}`);
  }

  createPokemon(body: any) {
    return this.http.post<any>(this.apiUrl, body);
  }
  updatePokemon(id: number, body: any) {
    return this.http.put<any>(`${this.apiUrl}/${id}`, body);
  }
}
