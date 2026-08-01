import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-portal-select',
  standalone: false,
  templateUrl: './portal-select.html',
  styleUrl: './portal-select.css',
})
export class PortalSelect {
  constructor(private router: Router) {}

  goToDoctor() {
    this.router.navigate(['/doctor/login']);
  }
}
