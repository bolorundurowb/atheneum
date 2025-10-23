import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const tabRoutes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'library',
        loadComponent: () => import('./library/library.page').then((m) => m.LibraryPage),
      },
      {
        path: 'wishlist',
        loadComponent: () => import('./wishlist/wishlist.page').then((m) => m.WishlistPage)
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings.page').then((m) => m.SettingsPage)
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full'
  }
];
