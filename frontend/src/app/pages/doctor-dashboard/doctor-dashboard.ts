import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService, Doctor } from '../../services/auth';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: false,
  templateUrl: './doctor-dashboard.html',
  styleUrl: './doctor-dashboard.css',
})
export class DoctorDashboard implements OnInit {
  doctor: Doctor | null = null;
  activeRoute = 'home';
  sidebarOpen = false;

  navItems = [
    { label: 'Home', route: 'home', icon: 'home' },
    { label: 'My Patients', route: 'my-patients', icon: 'patients' },
    { label: 'Capture Lead', route: 'capture-lead', icon: 'capture' },
    { label: 'Payment Status', route: 'payment-status', icon: 'payment' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.doctor = this.authService.getDoctor();

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      const url: string = e.urlAfterRedirects || e.url;
      const cleanUrl = url.split('?')[0];
      const segment = cleanUrl.split('/').pop() || 'home';
      this.activeRoute = segment;
    });

    const cleanUrl = this.router.url.split('?')[0];
    const segment = cleanUrl.split('/').pop() || 'home';
    this.activeRoute = segment;
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  navigate(route: string) {
    this.activeRoute = route;
    this.sidebarOpen = false;
    this.router.navigate(['/doctor/dashboard', route]);
  }

  logout() {
    this.authService.logout();
  }

  getInitials(name: string): string {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'DR';
  }
}
