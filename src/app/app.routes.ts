import {Routes} from "@angular/router";

export const routes: Routes = [
  {
    path: 'details',
    loadChildren: () => import('./details/book-details.routes').then(m => m.bookDetailsRoutes)
  }
];
