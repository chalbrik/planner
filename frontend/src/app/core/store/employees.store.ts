/**
 * EmployeesStore - State management dla pracowników
 *
 * Przechowuje:
 * - Lista pracowników
 * - Wybrany pracownik (do edycji/podglądu)
 * - Filtry (np. po lokacji)
 * - UI state (loading, errors)
 */

import { Injectable, computed } from '@angular/core';
import { BaseStore, StoreState } from './base-store';
import { Employee, EmployeeDetail } from '../services/employees/employee.types';

/**
 * Stan dla EmployeesStore
 */
interface EmployeesState extends StoreState {
  // Dane
  employees: Employee[];
  employeeDetails: Map<string, EmployeeDetail>; // Cache dla szczegółów

  // UI state
  selectedEmployeeId: string | null;

  // Filtry
  filterByLocationId: string | null;
  searchQuery: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeesStore extends BaseStore<EmployeesState> {

  // ========================================
  // SELECTORS (public readonly signals)
  // ========================================

  /**
   * Wszyscy pracownicy
   */
  public readonly employees = computed(() => this.state().employees);

  /**
   * Wybrane ID pracownika
   */
  public readonly selectedEmployeeId = computed(() => this.state().selectedEmployeeId);

  /**
   * Wybrany pracownik (pełne dane)
   */
  public readonly selectedEmployee = computed(() => {
    const state = this.state();
    if (!state.selectedEmployeeId) return null;
    return state.employees.find(e => e.id === state.selectedEmployeeId) || null;
  });

  /**
   * Szczegóły wybranego pracownika (cached)
   */
  public readonly selectedEmployeeDetails = computed(() => {
    const state = this.state();
    if (!state.selectedEmployeeId) return null;
    return state.employeeDetails.get(state.selectedEmployeeId) || null;
  });

  /**
   * Przefiltrowana lista pracowników
   */
  public readonly filteredEmployees = computed(() => {
    const state = this.state();
    let filtered = state.employees;

    // Filtruj po lokacji
    if (state.filterByLocationId) {
      filtered = filtered.filter(e =>
        e.locations.includes(state.filterByLocationId!)
      );
    }

    // Filtruj po search query
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(e =>
        e.full_name.toLowerCase().includes(query)
      );
    }

    return filtered;
  });

  /**
   * Pracownicy z umową o pracę
   */
  public readonly permanentEmployees = computed(() =>
    this.filteredEmployees().filter(e => e.agreement_type === 'permanent')
  );

  /**
   * Pracownicy z umową zlecenie
   */
  public readonly contractEmployees = computed(() =>
    this.filteredEmployees().filter(e => e.agreement_type === 'contract')
  );

  /**
   * Liczba pracowników
   */
  public readonly employeesCount = computed(() => this.employees().length);

  // ========================================
  // CONSTRUCTOR
  // ========================================

  constructor() {
    super({
      storeName: 'EmployeesStore',
      enableLogging: true
    });
  }

  // ========================================
  // INITIAL STATE
  // ========================================

  protected initialState(): EmployeesState {
    return {
      employees: [],
      employeeDetails: new Map(),
      selectedEmployeeId: null,
      filterByLocationId: null,
      searchQuery: '',
      isLoading: false,
      error: null
    };
  }

  // ========================================
  // ACTIONS (public methods)
  // ========================================

  /**
   * Ustaw listę pracowników
   */
  setEmployees(employees: Employee[]): void {
    this.setState({ employees });
  }

  /**
   * Dodaj pracownika
   */
  addEmployee(employee: Employee): void {
    this.updateState(state => ({
      ...state,
      employees: [...state.employees, employee]
    }));
  }

  /**
   * Aktualizuj pracownika
   */
  updateEmployee(id: string, updates: Partial<Employee>): void {
    this.updateState(state => ({
      ...state,
      employees: state.employees.map(emp =>
        emp.id === id ? { ...emp, ...updates } : emp
      )
    }));
  }

  /**
   * Usuń pracownika
   */
  deleteEmployee(id: string): void {
    this.updateState(state => {
      // Usuń też z cache szczegółów
      const newDetails = new Map(state.employeeDetails);
      newDetails.delete(id);

      return {
        ...state,
        employees: state.employees.filter(emp => emp.id !== id),
        employeeDetails: newDetails,
        // Jeśli usuwamy wybranego, odznacz
        selectedEmployeeId: state.selectedEmployeeId === id ? null : state.selectedEmployeeId
      };
    });
  }

  /**
   * Wybierz pracownika (do edycji/podglądu)
   */
  selectEmployee(id: string | null): void {
    this.setState({ selectedEmployeeId: id });
  }

  /**
   * Ustaw szczegóły pracownika (cache)
   */
  setEmployeeDetails(id: string, details: EmployeeDetail): void {
    this.updateState(state => {
      const newDetails = new Map(state.employeeDetails);
      newDetails.set(id, details);
      return { ...state, employeeDetails: newDetails };
    });
  }

  /**
   * Filtruj po lokacji
   */
  setLocationFilter(locationId: string | null): void {
    this.setState({ filterByLocationId: locationId });
  }

  /**
   * Ustaw search query
   */
  setSearchQuery(query: string): void {
    this.setState({ searchQuery: query });
  }

  /**
   * Wyczyść wszystkie filtry
   */
  clearFilters(): void {
    this.setState({
      filterByLocationId: null,
      searchQuery: ''
    });
  }

  /**
   * Znajdź pracownika po ID
   */
  getEmployeeById(id: string): Employee | undefined {
    return this.state().employees.find(e => e.id === id);
  }

  /**
   * Sprawdź czy pracownik istnieje
   */
  hasEmployee(id: string): boolean {
    return this.state().employees.some(e => e.id === id);
  }
}
