import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PatientService } from '../../../services/patient';

@Component({
  selector: 'app-capture-lead',
  standalone: false,
  templateUrl: './capture-lead.html',
  styleUrl: './capture-lead.css',
})
export class CaptureLead {
  form: FormGroup;
  loading = false;
  success = false;
  errorMessage = '';
  selectedUrgency = 'Routine';

  urgencyOptions = [
    { label: 'Routine' },
    { label: 'Priority' },
    { label: 'Urgent' },
  ];

  entTreatments = [
    'Septoplasty (Nasal Surgery)',
    'Tympanoplasty (Ear Surgery)',
    'Tonsillectomy (Throat Surgery)',
    'Adenoidectomy',
    'Hearing & Audiometry Test',
    'Sinus Endoscopy'
  ];

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private router: Router
  ) {
    this.form = this.fb.group({
      first_name: ['', Validators.required],
      last_name: [''],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      gender: ['Male'],
      dob: [''],
      age: [''],
      email: [''],
      country: ['India'],
      treatment_type: ['Septoplasty (Nasal Surgery)'],
      amount: [1500, [Validators.required, Validators.min(0)]],
      clinical_notes: [''],
      preferred_appointment: [''],
    });
  }

  setUrgency(level: string) {
    this.selectedUrgency = level;
  }

  onDobChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    if (val) {
      const dob = new Date(val);
      if (!isNaN(dob.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        this.form.patchValue({ age: Math.max(0, age) });
      }
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    const payload = { ...this.form.value, urgency_level: this.selectedUrgency };
    this.patientService.createPatient(payload).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.success = true;
          this.router.navigate(['/doctor/dashboard/home']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to capture lead. Please try again.';
      }
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}
