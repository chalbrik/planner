/**
 * LocationsStore - State management dla lokacji
 *
 * Przechowuje:
 * - Lista lokacji
 * - Wybrana lokacja
 * - UI state (loading, errors)
 */

import { Injectable, computed } from '@angular/core';
import { BaseStore, StoreState } from './base-store';
import { Location } from '../services/locations/location.types';

/**
 * Stan dla LocationsStore
 */
interface LocationsState extends StoreState {
  // Dane
  locations: Location[];

  // UI state
  selectedLocationId: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class LocationsStore extends BaseStore<LocationsState> {

  // ========================================
  // SELECTORS (public readonly signals)
  // ========================================

  /**
   * Wszystkie lokacje
   */
  public readonly locations = computed(() => this.state().locations);

  /**
   * Wybrane ID lokacji
   */
  public readonly selectedLocationId = computed(() => this.state().selectedLocationId);

  /**
   * Wybrana lokacja (pełne dane)
   */
  public readonly selectedLocation = computed(() => {
    const state = this.state();
    if (!state.selectedLocationId) return null;
    return state.locations.find(l => l.id === state.selectedLocationId) || null;
  });

  /**
   * Liczba lokacji
   */
  public readonly locationsCount = computed(() => this.locations().length);

  /**
   * Opcje dla select/dropdown (id + label)
   */
  public readonly locationOptions = computed(() =>
    this.locations().map(loc => ({
      value: loc.id,
      label: loc.name
    }))
  );

  /**
   * Czy użytkownik ma jakieś lokacje
   */
  public readonly hasLocations = computed(() => this.locationsCount() > 0);

  // ========================================
  // CONSTRUCTOR
  // ========================================

  constructor() {
    super({
      storeName: 'LocationsStore',
      enableLogging: true
    });
  }

  // ========================================
  // INITIAL STATE
  // ========================================

  protected initialState(): LocationsState {
    return {
      locations: [],
      selectedLocationId: null,
      isLoading: false,
      error: null
    };
  }

  // ========================================
  // ACTIONS (public methods)
  // ========================================

  /**
   * Ustaw listę lokacji
   */
  setLocations(locations: Location[]): void {
    this.setState({ locations });
  }

  /**
   * Dodaj lokację
   */
  addLocation(location: Location): void {
    this.updateState(state => ({
      ...state,
      locations: [...state.locations, location]
    }));
  }

  /**
   * Aktualizuj lokację
   */
  updateLocation(id: string, updates: Partial<Location>): void {
    this.updateState(state => ({
      ...state,
      locations: state.locations.map(loc =>
        loc.id === id ? { ...loc, ...updates } : loc
      )
    }));
  }

  /**
   * Usuń lokację
   */
  deleteLocation(id: string): void {
    this.updateState(state => ({
      ...state,
      locations: state.locations.filter(loc => loc.id !== id),
      // Jeśli usuwamy wybraną, odznacz
      selectedLocationId: state.selectedLocationId === id ? null : state.selectedLocationId
    }));
  }

  /**
   * Wybierz lokację
   */
  selectLocation(id: string | null): void {
    this.setState({ selectedLocationId: id });
  }

  /**
   * Znajdź lokację po ID
   */
  getLocationById(id: string): Location | undefined {
    return this.state().locations.find(l => l.id === id);
  }

  /**
   * Sprawdź czy lokacja istnieje
   */
  hasLocation(id: string): boolean {
    return this.state().locations.some(l => l.id === id);
  }

  /**
   * Pobierz nazwę lokacji po ID (helper)
   */
  getLocationName(id: string): string {
    const location = this.getLocationById(id);
    return location ? location.name : 'Nieznana lokacja';
  }
}
