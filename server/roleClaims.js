const { getApps, initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const ROLE_PERMISSIONS = Object.freeze({
  SUPER_ADMIN: [
    'overview.read', 'users.read', 'users.manage', 'portfolios.read', 'market.manage',
    'competitions.manage', 'support.read', 'support.reply', 'staff.read', 'staff.manage',
    'settings.manage', 'audit.read'
  ],
  SUPERVISOR: [
    'overview.read', 'users.read', 'users.manage', 'portfolios.read', 'market.manage',
    'competitions.manage', 'support.read', 'support.reply', 'audit.read'
  ],
  SUPPORT: ['overview.read', 'users.read', 'portfolios.read', 'support.read', 'support.reply'],
  ANALYST: ['overview.read', 'users.read', 'portfolios.read', 'competitions.manage', 'audit.read']
});

function getAdminAuth() {
  if (!getApps().length) {
    initializeApp({
      credential: applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || 'yin-trade-simulator-2026'
    });
  }
  return getAuth();
}

function validateRole(role) {
  if (!Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, role)) {
    throw new Error(`Unsupported role: ${role}`);
  }
}

async function setRoleByUid(uid, role, extraClaims = {}) {
  validateRole(role);
  const auth = getAdminAuth();
  const existing = (await auth.getUser(uid)).customClaims || {};
  const claims = {
    ...existing,
    ...extraClaims,
    role,
    permissions: ROLE_PERMISSIONS[role],
    claimsVersion: 1
  };
  await auth.setCustomUserClaims(uid, claims);
  return { uid, role, permissions: claims.permissions };
}

async function setRoleByEmail(email, role, extraClaims = {}) {
  const auth = getAdminAuth();
  const user = await auth.getUserByEmail(email);
  return setRoleByUid(user.uid, role, extraClaims);
}

module.exports = { ROLE_PERMISSIONS, getAdminAuth, setRoleByUid, setRoleByEmail, validateRole };
