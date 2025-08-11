export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  agreement_type: 'permanent' | 'contract';
  identification_number: string;
  job: string;
  contract_date_start: string;
  contract_date_end: string;
  job_rate: string;
  hour_rate: string;


  isSeparator: boolean;
}
