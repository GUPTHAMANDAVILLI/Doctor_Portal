import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PortalSelect } from './pages/portal-select/portal-select';
import { DoctorLogin } from './pages/doctor-login/doctor-login';
import { DoctorDashboard } from './pages/doctor-dashboard/doctor-dashboard';
import { Home } from './pages/doctor-dashboard/home/home';
import { MyPatients } from './pages/doctor-dashboard/my-patients/my-patients';
import { CaptureLead } from './pages/doctor-dashboard/capture-lead/capture-lead';
import { PaymentStatus } from './pages/doctor-dashboard/payment-status/payment-status';
import { AuthGuard } from './guards/auth-guard';

const routes: Routes = [
  { path: '', component: PortalSelect },
  { path: 'doctor/login', component: DoctorLogin },
  {
    path: 'doctor/dashboard',
    component: DoctorDashboard,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: Home },
      { path: 'my-patients', component: MyPatients },
      { path: 'capture-lead', component: CaptureLead },
      { path: 'payment-status', component: PaymentStatus },
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
