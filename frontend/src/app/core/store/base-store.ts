/**
 * Base Store Pattern with Angular Signals
 *
 * Lightweight state management inspirowany NgRx SignalStore
 * - Immutable state updates
 * - Type-safe
 * - Works perfectly with OnPush
 * - DevTools friendly (console logging)
 */

import { signal, computed, Signal } from '@angular/core';

/**
 * Interface dla stanu store
 */
export interface StoreState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Base configuration dla store
 */
export interface StoreConfig {
  storeName: string;
  enableLogging?: boolean; // Logging do konsoli (dev mode)
}

/**
 * Bazowa klasa dla wszystkich stores
 *
 * @example
 * interface EmployeeState extends StoreState {
 *   employees: Employee[];
 * }
 *
 * class EmployeeStore extends BaseStore<EmployeeState> {
 *   constructor() {
 *     super({
 *       storeName: 'EmployeeStore',
 *       enableLogging: true
 *     });
 *   }
 * }
 */
export abstract class BaseStore<T extends StoreState> {
  protected readonly config: StoreConfig;

  // Private writable signal
  protected readonly state = signal<T>(this.initialState());

  // Public readonly selectors
  public readonly isLoading: Signal<boolean> = computed(() => this.state().isLoading);
  public readonly error: Signal<string | null> = computed(() => this.state().error);

  constructor(config: StoreConfig) {
    this.config = {
      enableLogging: false, // Domyślnie wyłączone
      ...config
    };

    if (this.config.enableLogging) {
      this.log('🏪 Store initialized', this.state());
    }
  }

  /**
   * Początkowy stan - musi być zdefiniowany przez każdy store
   */
  protected abstract initialState(): T;

  /**
   * Aktualizacja stanu (immutable)
   *
   * @example
   * this.setState({ employees: [...newEmployees] });
   */
  protected setState(partial: Partial<T>): void {
    const currentState = this.state();
    const newState = { ...currentState, ...partial };

    if (this.config.enableLogging) {
      this.log('📝 State update', {
        previous: currentState,
        changes: partial,
        new: newState
      });
    }

    this.state.set(newState);
  }

  /**
   * Update stanu przez funkcję (dla complex updates)
   *
   * @example
   * this.updateState(state => ({
   *   ...state,
   *   employees: state.employees.map(e => e.id === id ? updated : e)
   * }));
   */
  public updateState(updateFn: (state: T) => T): void {
    const currentState = this.state();
    const newState = updateFn(currentState);

    if (this.config.enableLogging) {
      this.log('🔄 State update (function)', {
        previous: currentState,
        new: newState
      });
    }

    this.state.set(newState);
  }

  /**
   * Set loading state
   */
  public setLoading(isLoading: boolean): void {
    this.setState({ isLoading } as Partial<T>);
  }

  /**
   * Set error state
   */
  public setError(error: string | null): void {
    this.setState({ error, isLoading: false } as Partial<T>);
  }

  /**
   * Clear error state
   */
  public clearError(): void {
    this.setState({ error: null } as Partial<T>);
  }

  /**
   * Reset do początkowego stanu
   */
  public reset(): void {
    const initial = this.initialState();
    if (this.config.enableLogging) {
      this.log('🔄 Store reset', initial);
    }
    this.state.set(initial);
  }

  /**
   * Get current state snapshot (do użycia poza signals)
   */
  protected getSnapshot(): T {
    return this.state();
  }

  /**
   * Logging helper
   */
  private log(message: string, data?: any): void {
    if (this.config.enableLogging) {
      console.log(`[${this.config.storeName}] ${message}`, data || '');
    }
  }
}
``
