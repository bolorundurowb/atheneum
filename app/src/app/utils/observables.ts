import { Observable } from 'rxjs';

declare module 'rxjs' {
  interface Observable<T> {
    asPromise(): Promise<T>;
  }
}

export function asPromise<T>(observable: Observable<T>) {
  return new Promise<T>((resolve, reject) => {
    observable.subscribe({
      next: (value) => resolve(value),
      error: (error: any) => reject(error),
    });
  });
}

Observable.prototype.asPromise = function <T>() {
  return asPromise(this);
};
