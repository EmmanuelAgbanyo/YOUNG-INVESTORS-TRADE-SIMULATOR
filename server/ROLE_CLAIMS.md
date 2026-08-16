# Firebase role claims

The application uses Firebase Auth custom claims for privileged authorization. The supported roles are `SUPER_ADMIN`, `SUPERVISOR`, `SUPPORT`, and `ANALYST`. The canonical role-to-permission matrix is defined in `roleClaims.js` and is written into each user token as `role`, `permissions`, and `claimsVersion`.

The initial production provisioning target is `admin@yin.com` as `SUPER_ADMIN`. Provisioning must run in a trusted environment with a Firebase Admin SDK service account or Google Application Default Credentials. The service-account key must never be committed to the repository or pasted into the browser application.

From the `server` directory, set `GOOGLE_APPLICATION_CREDENTIALS` to a local service-account JSON path and run:

```bash
npm run provision:superadmin
```

The command defaults to `admin@yin.com`; an alternate target can be supplied with `SUPERADMIN_EMAIL`. After claims are assigned, the user must refresh the ID token by signing out and back in, or by using the Firebase client token refresh path. The frontend reads the claims with `getIdTokenResult` and gates the Admin Operations controls using the role permissions.

Firebase Realtime Database rules use `auth.token.role` for server-side authorization. The frontend’s legacy `admin@yin.com` fallback exists only as a migration bridge for existing sessions; production writes still require the custom claim in the Firebase token.
