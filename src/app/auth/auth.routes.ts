import { RouterModule, Routes } from '@angular/router';
import { AuthPage } from './auth.page';
import { NgModule } from '@angular/core';

export const authRoutes: Routes = [
  {
    path: '',
    component: AuthPage,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
      },
      {
        path: 'register',
        loadComponent: () => import('./register/register.page').then((m) => m.RegisterPage),
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage),
      },
      {
        path: 'verify',
        loadComponent: () => import('./verify/verify.page').then((m) => m.VerifyPage),
      }
    ]
  }
];
