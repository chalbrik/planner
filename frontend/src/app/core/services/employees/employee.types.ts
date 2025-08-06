export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  agreement_type: 'permanent' | 'contract';


  isSeparator: boolean;
}
