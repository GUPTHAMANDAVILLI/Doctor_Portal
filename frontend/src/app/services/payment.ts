import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

export interface Payment {
  id: number;
  patient_id: number;
  amount: number;
  status: string;
  payment_date: string;
  first_name: string;
  last_name: string;
  phone: string;
  patient_uid: string;
  gender?: string;
  treatment_type: string;
  preferred_appointment?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private apiUrl = 'https://doctor-portal-backend-6zix.onrender.com/api/payments';

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getPayments(): Observable<{ success: boolean; payments: Payment[]; summary: { total_earned: number; total_pending: number } }> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() });
  }

  updateStatus(id: number, status: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, { status }, { headers: this.getHeaders() });
  }
}
