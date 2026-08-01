import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface Doctor {
  id: number;
  name: string;
  email: string;
  specialization: string;
  hospital_name: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  doctor: Doctor;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => {
        if (res.success) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('doctor', JSON.stringify(res.doctor));
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('doctor');
    this.router.navigate(['/']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getDoctor(): Doctor | null {
    try {
      const d = localStorage.getItem('doctor');
      return d ? JSON.parse(d) : null;
    } catch (e) {
      return null;
    }
  }
}
