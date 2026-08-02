import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { PaymentService, Payment } from '../../../services/payment';

@Component({
  selector: 'app-payment-status',
  standalone: false,
  templateUrl: './payment-status.html',
  styleUrl: './payment-status.css',
})
export class PaymentStatus implements OnInit {
  payments: Payment[] = [];
  summary = { total_earned: 0, total_pending: 0 };
  loading = false;
  searchQuery = '';
  activeFilter: 'All' | 'In Treatment' | 'Treated' = 'All';

  constructor(
    private paymentService: PaymentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  get filteredPayments(): Payment[] {
    return this.payments.filter(p => {
      const patientStatus = p.status === 'Paid' ? 'Treated' : 'In Treatment';

      // 1. Status Filter (AND logic)
      if (this.activeFilter === 'In Treatment' && patientStatus !== 'In Treatment') return false;
      if (this.activeFilter === 'Treated' && patientStatus !== 'Treated') return false;

      // 2. Search Query Filter (AND logic)
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase().trim();
        const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
        const phone = (p.phone || '').toLowerCase();
        const uid = (p.patient_uid || '').toLowerCase();
        const treatment = (p.treatment_type || '').toLowerCase();

        const matches = fullName.includes(q) || phone.includes(q) || uid.includes(q) || treatment.includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }

  setFilter(filter: 'All' | 'In Treatment' | 'Treated'): void {
    this.activeFilter = filter;
  }

  loadPayments(): void {
    this.loading = true;
    this.paymentService.getPayments().subscribe({
      next: (res) => {
        this.loading = false;
        if (res && res.success && Array.isArray(res.payments)) {
          this.payments = res.payments;
          this.recalculateSummary();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  togglePaymentStatus(payment: Payment): void {
    const originalStatus = payment.status;
    const newStatus = originalStatus === 'Paid' ? 'Pending' : 'Paid';
    payment.status = newStatus;
    this.recalculateSummary();
    this.cdr.detectChanges();

    this.paymentService.updateStatus(payment.id, newStatus).subscribe({
      next: (res) => {
        if (res.success && res.payment) {
          payment.status = res.payment.status;
        } else {
          payment.status = originalStatus;
        }
        this.recalculateSummary();
        this.cdr.detectChanges();
      },
      error: () => {
        payment.status = originalStatus;
        this.recalculateSummary();
        this.cdr.detectChanges();
      }
    });
  }

  recalculateSummary(): void {
    const total_earned = this.payments
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const total_pending = this.payments
      .filter(p => p.status === 'Pending')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    this.summary = { total_earned, total_pending };
  }

  getInitial(name: string): string {
    return name ? name[0].toUpperCase() : 'P';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
