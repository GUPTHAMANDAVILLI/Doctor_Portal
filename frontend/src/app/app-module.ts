import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { PortalSelect } from './pages/portal-select/portal-select';
import { DoctorLogin } from './pages/doctor-login/doctor-login';
import { DoctorDashboard } from './pages/doctor-dashboard/doctor-dashboard';
import { Home } from './pages/doctor-dashboard/home/home';
import { MyPatients } from './pages/doctor-dashboard/my-patients/my-patients';
import { CaptureLead } from './pages/doctor-dashboard/capture-lead/capture-lead';
import { PaymentStatus } from './pages/doctor-dashboard/payment-status/payment-status';

@NgModule({
  declarations: [
    App,
    PortalSelect,
    DoctorLogin,
    DoctorDashboard,
    Home,
    MyPatients,
    CaptureLead,
    PaymentStatus,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [provideBrowserGlobalErrorListeners()],
  bootstrap: [App],
})
export class AppModule {}
