const { setRoleByEmail } = require('./roleClaims');

const email = process.env.SUPERADMIN_EMAIL || 'admin@yin.com';

setRoleByEmail(email, 'SUPER_ADMIN')
  .then(result => {
    console.log(JSON.stringify({ ok: true, ...result }, null, 2));
  })
  .catch(error => {
    console.error(`Failed to provision SUPER_ADMIN for ${email}:`, error.message);
    process.exitCode = 1;
  });
