import { mapToCanActivate, Routes } from '@angular/router';
import { AuthGuard } from './guards';

export const routes: Routes = [
  {
    path: '',
    canActivate: mapToCanActivate([ AuthGuard ]),
    loadChildren: () => import('./tabs/tabs.routes').then(m => m.tabRoutes)
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'details',
    loadChildren: () => import('./details/book-details.routes').then(m => m.bookDetailsRoutes)
  }
];
