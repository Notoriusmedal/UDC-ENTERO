import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

async function ensureSession(auth: AuthService): Promise<void> {
  if (!auth.isAuthenticated()) {
    await auth.restoreSession();
  }
}

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await ensureSession(auth);

  return auth.isAuthenticated() ? true : router.createUrlTree(['/dashboard']);
};

export const roleGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await ensureSession(auth);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/dashboard']);
  }

  const allowedRoles = route.data['roles'] as string[] | undefined;
  if (!allowedRoles?.length) {
    return true;
  }

  return allowedRoles.includes(auth.user()?.rol ?? '') ? true : router.createUrlTree(['/dashboard']);
};
