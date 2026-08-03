import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { PatientService, Patient, PatientStats } from '../../../services/patient';
import { PaymentService } from '../../../services/payment';

@Component({
  selector: 'app-my-patients',
  standalone: false,
  templateUrl: './my-patients.html',
  styleUrl: './my-patients.css',
})
export class MyPatients implements OnInit {
  allPatients: Patient[] = [];
  stats = { total_patients: 0, in_treatment: 0, converted: 0, total_earned: 0 };
  searchQuery = '';
  activeFilter: 'All' | 'In Treatment' | 'Treated' = 'All';
  genderFilter: 'All' | 'Male' | 'Female' | 'Other' = 'All';

  // Edit Modal State
  editingPatient: Patient | null = null;

  // Delete Confirmation State
  deleteConfirmId: number | null = null;

  entTreatments = [
    'Septoplasty (Nasal Surgery)',
    'Tympanoplasty (Ear Surgery)',
    'Tonsillectomy (Throat Surgery)',
    'Adenoidectomy',
    'Hearing & Audiometry Test',
    'Sinus Endoscopy',
    'IUI Treatment'
  ];

  constructor(
    private patientService: PatientService,
    private paymentService: PaymentService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  togglePaymentStatus(p: Patient): void {
    const newStatus = p.payment_status === 'Paid' ? 'Pending' : 'Paid';
    p.payment_status = newStatus;
    p.status = newStatus === 'Paid' ? 'Treated' : 'In Treatment';
    this.recalculateStats();
    this.cdr.detectChanges();

    this.paymentService.updateStatus(p.id, newStatus).subscribe({
      next: (res) => {
        if (res.success && res.payment) {
          p.payment_status = res.payment.status;
          p.status = res.payment.status === 'Paid' ? 'Treated' : 'In Treatment';
          this.recalculateStats();
          this.cdr.detectChanges();
        }
      },
      error: () => {
        p.payment_status = newStatus === 'Paid' ? 'Pending' : 'Paid';
        p.status = p.payment_status === 'Paid' ? 'Treated' : 'In Treatment';
        this.recalculateStats();
        this.cdr.detectChanges();
      }
    });
  }

  setFilter(filter: 'All' | 'In Treatment' | 'Treated'): void {
    this.activeFilter = filter;
  }

  setGenderFilter(gender: 'All' | 'Male' | 'Female' | 'Other'): void {
    this.genderFilter = gender;
  }

  get filteredPatients(): Patient[] {
    return this.allPatients.filter(p => {
      // 1. Status Filter (AND logic)
      if (this.activeFilter === 'In Treatment' && p.status !== 'In Treatment') return false;
      if (this.activeFilter === 'Treated' && p.status !== 'Treated') return false;

      // 2. Gender Filter (AND logic)
      if (this.genderFilter !== 'All') {
        const patientGender = (p.gender || '').toLowerCase().trim();
        if (patientGender !== this.genderFilter.toLowerCase()) return false;
      }

      // 3. Search Query Filter (AND logic)
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase().trim();
        const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
        const phone = (p.phone || '').toLowerCase();
        const uid = (p.patient_uid || '').toLowerCase();
        const treatment = (p.treatment_type || '').toLowerCase();
        const email = (p.email || '').toLowerCase();
        const country = (p.country || '').toLowerCase();
        const urgency = (p.urgency_level || '').toLowerCase();
        const notes = (p.clinical_notes || '').toLowerCase();

        const matches = fullName.includes(q) || phone.includes(q) || uid.includes(q) ||
                        treatment.includes(q) || email.includes(q) || country.includes(q) ||
                        urgency.includes(q) || notes.includes(q);

        if (!matches) return false;
      }
      return true;
    });
  }

  recalculateStats(): void {
    const total_patients = this.allPatients.length;
    const in_treatment = this.allPatients.filter(p => p.status === 'In Treatment').length;
    const converted = this.allPatients.filter(p => p.status === 'Treated').length;
    const total_earned = this.allPatients
      .filter(p => p.payment_status === 'Paid')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    this.stats = { total_patients, in_treatment, converted, total_earned };
  }

  loadPatients(): void {
    this.patientService.getPatients().subscribe({
      next: res => {
        if (res && res.success && Array.isArray(res.patients)) {
          this.allPatients = res.patients;
          this.recalculateStats();
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.recalculateStats();
        this.cdr.detectChanges();
      }
    });
  }

  onSearch(query: string): void {
    this.searchQuery = query;
  }

  goToCaptureLead(): void {
    this.router.navigate(['/doctor/dashboard/capture-lead']);
  }

  openEditModal(p: Patient): void {
    let formattedAppt = '';
    if (p.preferred_appointment) {
      const apptStr = String(p.preferred_appointment);
      formattedAppt = apptStr.includes('T') ? apptStr.split('T')[0] : apptStr.slice(0, 10);
    }
    let formattedDob = '';
    if (p.dob) {
      const dobStr = String(p.dob);
      formattedDob = dobStr.includes('T') ? dobStr.split('T')[0] : dobStr.slice(0, 10);
    }
    this.editingPatient = {
      ...p,
      preferred_appointment: formattedAppt,
      dob: formattedDob
    };
  }

  cancelEdit(): void {
    this.editingPatient = null;
  }

  onDobChange(event: Event) {
    if (!this.editingPatient) return;
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
        this.editingPatient.age = Math.max(0, age);
      }
    }
  }

  saveEdit(): void {
    if (!this.editingPatient) return;
    const target = { ...this.editingPatient };
    const id = target.id;

    const idx = this.allPatients.findIndex(pt => pt.id === id);
    if (idx !== -1) {
      const isPaid = this.allPatients[idx].payment_status === 'Paid';
      this.allPatients[idx] = {
        ...target,
        amount: Number(target.amount),
        payment_status: isPaid ? 'Paid' : 'Pending',
        status: isPaid ? 'Treated' : 'In Treatment'
      };
    }

    this.recalculateStats();
    this.editingPatient = null;

    this.patientService.updatePatient(id, {
      first_name: target.first_name,
      last_name: target.last_name,
      phone: target.phone,
      gender: target.gender,
      dob: target.dob,
      age: target.age,
      email: target.email,
      country: target.country,
      urgency_level: target.urgency_level,
      treatment_type: target.treatment_type,
      clinical_notes: target.clinical_notes,
      amount: target.amount,
      preferred_appointment: target.preferred_appointment
    }).subscribe({
      next: () => this.loadPatients(),
      error: () => this.loadPatients()
    });
  }

  confirmDelete(id: number): void {
    this.deleteConfirmId = id;
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
  }

  executeDelete(id: number): void {
    const targetId = id;
    this.deleteConfirmId = null;

    // Optimistically remove from view
    const previousPatients = [...this.allPatients];
    this.allPatients = this.allPatients.filter(p => p.id !== targetId);
    this.recalculateStats();

    this.patientService.deletePatient(targetId).subscribe({
      next: () => {
        // Success - reload patients just to be in sync
        this.loadPatients();
      },
      error: (err) => {
        console.error('Delete failed:', err);
        alert('Failed to delete patient. Please try again.');
        // Revert local optimistic update
        this.allPatients = previousPatients;
        this.recalculateStats();
        this.loadPatients();
      }
    });
  }

  getInitial(name: string): string {
    return name ? name[0].toUpperCase() : 'P';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
}
