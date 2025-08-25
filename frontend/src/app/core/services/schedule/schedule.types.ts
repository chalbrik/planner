import {Employee} from '../employees/employee.types';

export interface WorkHours {
  id: string;
  employee: string;
  location: string;
  date: string;
  hours: string;
}

export interface ScheduleData {
  employees: Employee[];
  workHours: WorkHours[];
}
