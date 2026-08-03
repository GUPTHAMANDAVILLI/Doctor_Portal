import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

export interface Patient {
  id: number;
  doctor_id: number;
  patient_uid: string;
  first_name: string;
  last_name: string;
  phone: string;
  gender: string;
  dob: string;
  age: number;
  email: string;
  country: string;
  urgency_level: string;
  clinical_notes: string;
  preferred_appointment: string;
  treatment_type: string;
  status: string;
  amount: number;
  payment_status: string;
  paid_amount: number;
  created_at: string;
}

export interface PatientStats {
  total_patients: number;
  in_treatment: number;
  treated: number;
  total_earned: number;
}

@Injectable({ providedIn: 'root' })
export class PatientService {
  private apiUrl = window.location.origin.includes('localhost') 
    ? 'http://localhost:5000/api/patients' 
    : 'https://doctor-portal-backend-6zix.onrender.com/api/patients';

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getStats(): Observable<{ success: boolean; stats: PatientStats }> {
    return this.http.get<any>(`${this.apiUrl}/stats`, { headers: this.getHeaders() });
  }

  getPatients(status?: string, search?: string): Observable<{ success: boolean; patients: Patient[] }> {
    let params = new HttpParams();
    if (status && status !== 'All') params = params.set('status', status);
    if (search) params = params.set('search', search);
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders(), params });
  }

  createPatient(patient: Partial<Patient>): Observable<any> {
    return this.http.post<any>(this.apiUrl, patient, { headers: this.getHeaders() });
  }

  updatePatient(id: number, patient: Partial<Patient>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, patient, { headers: this.getHeaders() });
  }

  deletePatient(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
