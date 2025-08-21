export interface Employee {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  agreement_type: 'permanent' | 'contract';
  identification_number: string;
  job: string;
  contract_date_start: string;
  contract_date_end: string;
  job_rate: string;
  hour_rate: string;
  locations: string[];
}

// Nowy interfejs dla szczegółów pracownika z zagnieżdżonymi danymi
export interface EmployeeDetail {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  agreement_type: 'permanent' | 'contract';
  identification_number?: string;
  job?: string;
  contract_date_start?: string;
  contract_date_end?: string;
  job_rate?: number;
  hour_rate?: number;
  school: School;
  previous_employers: PreviousEmployer[];
  locations: string[];
}

// Interfejs do tworzenia pracownika
export interface CreateEmployeeRequest {
  full_name: string;
  email: string;
  phone: string;
  agreement_type: 'permanent' | 'contract';
  identification_number?: string;
  job?: string;
  contract_date_start?: string;
  contract_date_end?: string;
  job_rate?: number;
  hour_rate?: number;
  school_type: string;
  school_name: string;
  graduation_year: string;
  previous_employers: PreviousEmployer[];
}

export interface School {
  school_type: string;
  school_name: string;
  graduation_year: string;
}

export interface PreviousEmployer {
  employer_name: string;
  employee_position: string;
  work_date_start: string;
  work_date_end: string;
}
