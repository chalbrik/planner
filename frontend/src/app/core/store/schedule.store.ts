/**
 * ScheduleStore - State management dla grafików pracy
 *
 * Przechowuje:
 * - Godziny pracy (WorkHours)
 * - Konflikty (conflicts)
 * - Parametry widoku (location, month, year)
 * - UI state (loading, errors)
 */

import { Injectable, computed } from '@angular/core';
import { BaseStore, StoreState } from './base-store';
import { WorkHours } from '../services/schedule/schedule.types';
import { ConflictData } from '../services/schedule/schedule.service';

/**
 * Stan dla ScheduleStore
 */
interface ScheduleState extends StoreState {
  // Dane
  workHours: WorkHours[];
  conflicts: ConflictData | null;

  // Filtry/parametry
  selectedLocationId: string;
  currentMonth: number;  // 1-12
  currentYear: number;

  // UI state
  selectedCellIds: Set<string>; // "employeeId-date"
  workingDaysInMonth: number;
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleStore extends BaseStore<ScheduleState> {

  // ========================================
  // SELECTORS (public readonly signals)
  // ========================================

  /**
   * Wszystkie godziny pracy
   */
  public readonly workHours = computed(() => this.state().workHours);

  /**
   * Konflikty
   */
  public readonly conflicts = computed(() => this.state().conflicts);

  /**
   * Wybrana lokacja
   */
  public readonly selectedLocationId = computed(() => this.state().selectedLocationId);

  /**
   * Aktualny miesiąc (1-12)
   */
  public readonly currentMonth = computed(() => this.state().currentMonth);

  /**
   * Aktualny rok
   */
  public readonly currentYear = computed(() => this.state().currentYear);

  /**
   *
   */
  public readonly workingDaysInMonth = computed(() => this.state().workingDaysInMonth);

  /**
   * Data jako Date object (dla wygody)
   */
  public readonly currentDate = computed(() => {
    const state = this.state();
    return new Date(state.currentYear, state.currentMonth - 1, 1);
  });

  /**
   * Zaznaczone komórki
   */
  public readonly selectedCellIds = computed(() => this.state().selectedCellIds);

  /**
   * Godziny pracy dla konkretnego pracownika i dnia
   */
  public getWorkHoursForCell(employeeId: string, date: string): string | null {
    const workHours = this.state().workHours;
    const found = workHours.find(wh =>
      wh.employee === employeeId && wh.date === date
    );
    return found ? found.hours : null;
  }

  /**
   * Sprawdź czy komórka jest zaznaczona
   */
  public isCellSelected(employeeId: string, date: string): boolean {
    const cellId = `${employeeId}-${date}`;
    return this.state().selectedCellIds.has(cellId);
  }

  // ========================================
  // CONSTRUCTOR
  // ========================================

  constructor() {
    super({
      storeName: 'ScheduleStore',
      enableLogging: true // Włącz logging w dev mode
    });
  }

  // ========================================
  // INITIAL STATE
  // ========================================

  protected initialState(): ScheduleState {
    const now = new Date();
    return {
      workHours: [],
      conflicts: null,
      selectedLocationId: '',
      currentMonth: now.getMonth() + 1,
      currentYear: now.getFullYear(),
      selectedCellIds: new Set<string>(),
      workingDaysInMonth: 0,
      isLoading: false,
      error: null
    };
  }

  // ========================================
  // ACTIONS (public methods)
  // ========================================

  /**
   * Ustaw godziny pracy
   */
  setWorkHours(workHours: WorkHours[]): void {
    this.setState({ workHours });
  }

  /**
   * Dodaj godziny pracy
   */
  addWorkHours(workHour: WorkHours): void {
    this.updateState(state => ({
      ...state,
      workHours: [...state.workHours, workHour]
    }));
  }

  /**
   * Aktualizuj godziny pracy
   */
  updateWorkHours(id: string, hours: string): void {
    this.updateState(state => ({
      ...state,
      workHours: state.workHours.map(wh =>
        wh.id === id ? { ...wh, hours } : wh
      )
    }));
  }

  /**
   * Usuń godziny pracy
   */
  deleteWorkHours(id: string): void {
    this.updateState(state => ({
      ...state,
      workHours: state.workHours.filter(wh => wh.id !== id)
    }));
  }

  /**
   * Ustaw konflikty
   */
  setConflicts(conflicts: ConflictData | null): void {
    this.setState({ conflicts });
  }

  /**
   * Zmień lokację
   */
  setLocation(locationId: string): void {
    this.setState({
      selectedLocationId: locationId,
      workHours: [], // Wyczyść dane przy zmianie lokacji
      conflicts: null
    });
  }

  /**
   * Zmień miesiąc (np. +1 lub -1)
   */
  changeMonth(offset: number): void {
    const state = this.state();
    const newDate = new Date(state.currentYear, state.currentMonth - 1 + offset, 1);

    this.setState({
      currentMonth: newDate.getMonth() + 1,
      currentYear: newDate.getFullYear(),
      workHours: [], // Wyczyść dane przy zmianie miesiąca
      conflicts: null
    });
  }

  /**
   * Ustaw konkretny miesiąc i rok
   */
  setMonthYear(month: number, year: number): void {
    this.setState({
      currentMonth: month,
      currentYear: year,
      workHours: [],
      conflicts: null
    });
  }

  /**
   * Zaznacz komórkę (dla multi-select)
   */
  selectCell(employeeId: string, date: string): void {
    const cellId = `${employeeId}-${date}`;
    this.updateState(state => {
      const newSet = new Set(state.selectedCellIds);
      newSet.add(cellId);
      return { ...state, selectedCellIds: newSet };
    });
  }

  /**
   * Odznacz komórkę
   */
  deselectCell(employeeId: string, date: string): void {
    const cellId = `${employeeId}-${date}`;
    this.updateState(state => {
      const newSet = new Set(state.selectedCellIds);
      newSet.delete(cellId);
      return { ...state, selectedCellIds: newSet };
    });
  }

  /**
   * Wyczyść wszystkie zaznaczenia
   */
  clearSelection(): void {
    this.setState({ selectedCellIds: new Set<string>() });
  }

  /**
   * Zaznacz wiele komórek naraz
   */
  selectMultipleCells(cells: Array<{employeeId: string, date: string}>): void {
    this.updateState(state => {
      const newSet = new Set(state.selectedCellIds);
      cells.forEach(cell => {
        const cellId = `${cell.employeeId}-${cell.date}`;
        newSet.add(cellId);
      });
      return { ...state, selectedCellIds: newSet };
    });
  }

  /**
   * Ustaw liczbę dni roboczych w miesiącu
   */
  setWorkingDays(days: number): void {
    this.setState({ workingDaysInMonth: days });
  }
}
