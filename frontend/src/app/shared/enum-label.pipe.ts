import { Pipe, PipeTransform } from '@angular/core';

/** Turns an enum value into display text: "IN_PROGRESS" -> "In Progress", "LOW" -> "Low". */
export function enumLabel(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Template version of enumLabel: {{ ticket.status | enumLabel }} */
@Pipe({ name: 'enumLabel' })
export class EnumLabelPipe implements PipeTransform {
  transform(value: string): string {
    return enumLabel(value);
  }
}
