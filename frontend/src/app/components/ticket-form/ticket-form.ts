import { Component, OnInit, effect, inject, input, output } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PRIORITIES, Priority, Ticket } from '../../models/ticket.model';
import { EnumLabelPipe } from '../../shared/enum-label.pipe';

/** What the form emits on a valid submit. The parent page turns it into a create or update request. */
export interface TicketFormValue {
  title: string;
  description: string;
  priority: Priority;
  createdBy: string;
}

/**
 * Required + length check on the *trimmed* text, because trimmed text is what we send to the backend.
 * Mirrors @NotBlank and @Size on the Java request DTO. Uses the same error keys as Angular's built-in
 * validators (required / minlength / maxlength), so the template can check them the usual way.
 */
function trimmedLength(min: number, max: number): ValidatorFn {
  return (control: AbstractControl<string>) => {
    const length = control.value.trim().length;
    if (length === 0) {
      return { required: true };
    }
    if (length < min) {
      return { minlength: { requiredLength: min, actualLength: length } };
    }
    if (length > max) {
      return { maxlength: { requiredLength: max, actualLength: length } };
    }
    return null;
  };
}

/**
 * Shared create/edit form. It only collects and validates input; the parent page calls the API.
 *
 *  Parent -> form (inputs):  ticket (edit mode), saving, serverErrors, submitLabel, cancelLink
 *  Form -> parent (output):  save(TicketFormValue)
 */
@Component({
  selector: 'app-ticket-form',
  imports: [ReactiveFormsModule, RouterLink, EnumLabelPipe],
  templateUrl: './ticket-form.html',
  styleUrl: './ticket-form.css',
})
export class TicketForm implements OnInit {
  /** Existing ticket to edit. When absent, the form is in "create" mode. */
  readonly ticket = input<Ticket | null>(null);
  /** True while the parent's request is running: disables the submit button (no double submits). */
  readonly saving = input(false);
  /** Field errors from a backend 400 ProblemDetail, e.g. { title: "must not be blank" }. */
  readonly serverErrors = input<Record<string, string> | null>(null);
  readonly submitLabel = input('Save');
  readonly cancelLink = input('/tickets');

  readonly save = output<TicketFormValue>();

  protected readonly priorities = PRIORITIES;
  protected readonly limits = { titleMin: 3, titleMax: 100, descriptionMax: 2000, createdByMax: 100 };

  protected readonly form = inject(NonNullableFormBuilder).group({
    title: ['', trimmedLength(this.limits.titleMin, this.limits.titleMax)],
    description: ['', trimmedLength(1, this.limits.descriptionMax)],
    priority: [null as Priority | null, Validators.required],
    createdBy: ['', trimmedLength(1, this.limits.createdByMax)],
  });

  constructor() {
    // Whenever the parent passes new server errors, attach each one to its form control.
    effect(() => {
      const errors = this.serverErrors();
      if (!errors) {
        return;
      }
      for (const [field, message] of Object.entries(errors)) {
        const control = this.form.get(field);
        if (control) {
          control.setErrors({ server: message });
          control.markAsTouched();
        }
      }
    });
  }

  ngOnInit(): void {
    const ticket = this.ticket();
    if (ticket) {
      this.form.patchValue({ title: ticket.title, description: ticket.description, priority: ticket.priority });
      // createdBy cannot be changed after creation: a disabled control is skipped by validation.
      this.form.controls.createdBy.disable();
    }
  }

  protected get isEditMode(): boolean {
    return this.ticket() !== null;
  }

  /** Show a control's errors only after the user has interacted with it (or tried to submit). */
  protected showErrors(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { title, description, priority, createdBy } = this.form.getRawValue();
    if (priority === null) {
      return; // unreachable when valid (priority is required); narrows the type for TypeScript
    }
    this.save.emit({
      title: title.trim(),
      description: description.trim(),
      priority,
      createdBy: createdBy.trim(),
    });
  }
}
