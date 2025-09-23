import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hoursFormat',
  standalone: true
})
export class HoursFormatPipe implements PipeTransform {

  transform(decimalHours: number): string {
    if (!decimalHours || decimalHours === 0) return '0h';

    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);

    if (minutes === 0) {
      return `${hours}h`;
    } else if (minutes === 60) {
      return `${hours + 1}h`;
    } else {
      return `${hours}h ${minutes}min`;
    }
  }
}
