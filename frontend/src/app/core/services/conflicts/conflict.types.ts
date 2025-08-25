export interface ValidationResult {
  type: 'exceed12h' | 'conflict11h' | 'badWeek35h';
  message: string;
}

export interface ConflictState {
  conflicting: Set<string>;
  badWeeks: Map<string, Set<number>>;
  exceeding12h: Set<string>;
}
