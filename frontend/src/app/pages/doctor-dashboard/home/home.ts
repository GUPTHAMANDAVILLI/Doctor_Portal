import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { PatientService, PatientStats, Patient } from '../../../services/patient';
import { PaymentService } from '../../../services/payment';
import { AuthService, Doctor } from '../../../services/auth';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  stats: PatientStats = { total_patients: 0, in_treatment: 0, treated: 0, total_earned: 0 };
  doctor: Doctor | null = null;
  recentPatients: Patient[] = [];
  loading = true;

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
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.doctor = this.authService.getDoctor();
    this.loadStatsAndPatients();
  }

  togglePaymentStatus(p: Patient): void {
    const newStatus = p.payment_status === 'Paid' ? 'Pending' : 'Paid';
    p.payment_status = newStatus;
    p.status = newStatus === 'Paid' ? 'Treated' : 'In Treatment';
    this.recalculateStats(this.recentPatients);
    this.cdr.detectChanges();

    this.paymentService.updateStatus(p.id, newStatus).subscribe({
      next: (res) => {
        if (res.success && res.payment) {
          p.payment_status = res.payment.status;
          p.status = res.payment.status === 'Paid' ? 'Treated' : 'In Treatment';
          this.recalculateStats(this.recentPatients);
          this.cdr.detectChanges();
        }
      },
      error: () => {
        p.payment_status = newStatus === 'Paid' ? 'Pending' : 'Paid';
        p.status = p.payment_status === 'Paid' ? 'Treated' : 'In Treatment';
        this.recalculateStats(this.recentPatients);
        this.cdr.detectChanges();
      }
    });
  }

  recalculateStats(patients: Patient[]): void {
    const total_patients = patients.length;
    const in_treatment = patients.filter(p => p.status === 'In Treatment').length;
    const treated = patients.filter(p => p.status === 'Treated').length;
    const total_earned = patients
      .filter(p => p.payment_status === 'Paid')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    this.stats = { total_patients, in_treatment, treated, total_earned };
  }

  loadStatsAndPatients(): void {
    this.loading = true;
    this.patientService.getPatients().subscribe({
      next: (res) => {
        this.loading = false;
        if (res && res.success && Array.isArray(res.patients)) {
          this.recentPatients = res.patients;
          this.recalculateStats(res.patients);
        } else {
          this.recalculateStats([]);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.recalculateStats([]);
        this.cdr.detectChanges();
      }
    });
  }

  navigateTo(route: string): void {
    this.router.navigate(['/doctor/dashboard', route]);
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

    const idx = this.recentPatients.findIndex(pt => pt.id === id);
    if (idx !== -1) {
      const isPaid = this.recentPatients[idx].payment_status === 'Paid';
      this.recentPatients[idx] = {
        ...target,
        amount: Number(target.amount),
        payment_status: isPaid ? 'Paid' : 'Pending',
        status: isPaid ? 'Treated' : 'In Treatment'
      };
    }

    this.recalculateStats(this.recentPatients);
    this.editingPatient = null;
    this.cdr.detectChanges();

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
      next: () => this.loadStatsAndPatients(),
      error: () => this.loadStatsAndPatients()
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

    this.recentPatients = this.recentPatients.filter(p => p.id !== targetId);
    this.recalculateStats(this.recentPatients);
    this.cdr.detectChanges();

    this.patientService.deletePatient(targetId).subscribe({
      next: () => this.loadStatsAndPatients(),
      error: () => this.loadStatsAndPatients()
    });
  }

  getInitial(name: string): string {
    return name ? name[0].toUpperCase() : 'P';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
