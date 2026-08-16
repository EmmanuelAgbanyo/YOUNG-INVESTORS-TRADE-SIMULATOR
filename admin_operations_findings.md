# Admin Operations Center Findings

## Implemented

- Admin Operations Center with Overview, Users, Portfolios, Competitions, Support, and Staff sections.
- Market operations for opening and closing sessions plus AUTO/MANUAL control mode.
- Competition creation with invite-only or open registration, scoring mode, schedule, starting capital, participant limits, invite codes, lifecycle actions, and participant counts.
- User-facing Competitions view with invite-code joining.
- User-facing Support Center with ticket creation, status, priority, and message threads.
- Admin support workspace with ticket assignment, status updates, priority updates, and replies.
- Staff/admin provisioning records with role and permission fields. Firebase Auth account creation still belongs in a trusted server or Cloud Function.
- Account-status fields and login blocking for suspended profiles.
- Firebase API methods and database paths for competitions, invitations, support tickets, staff, and audit events.
- Graceful reads for new operations paths so an undeployed production path does not blank the entire Admin Operations Center.
- Realtime Database rule for `market_control_mode`, required for atomic market status and control-mode updates.

## Validation

- `npm run build` passes successfully.
- Local Auth and Realtime Database emulators were started and seeded.
- Admin Operations Center rendered with local user and AUM metrics.
- Atomic market update probe passed with `market_status: OPEN` and `market_control_mode: MANUAL`.
- Competition form rendered with schedule, scoring, capital, and invitation controls.
- Direct emulator competition write passed under the updated rules.

## Production considerations

The updated `database.rules.json` must be deployed to production for the new competition, support, staff, audit, and market-control paths to work there. For production security, broad authenticated write access should later be replaced with custom claims and trusted server/Cloud Function authorization. Staff invitation records do not create Firebase Auth accounts by themselves; that operation should be completed through a protected backend flow.
