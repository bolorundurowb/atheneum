import {Routes} from "@angular/router";
import {BookDetailsPage} from "./book-details-page.component";

export const bookDetailsRoutes: Routes = [
  {
    path: '',
    component: BookDetailsPage,
    children: [
      {
        path: 'book',
        loadComponent: () => import('./book/book.page').then((m) => m.BookPage),
      }
    ]
  }
]
