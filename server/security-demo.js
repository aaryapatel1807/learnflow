/**
 * AWD Task-3 — standalone demonstration of the security libraries.
 * Run:  node security-demo.js     (no server or database needed)
 *
 * Part A: bcrypt — hash a password, then verify correct and wrong attempts.
 * Part B: Joi    — the project's real auth schemas accepting valid input
 *                  and rejecting invalid input and a NoSQL-injection payload.
 * Helmet is Express middleware, so it is demonstrated against the running
 * server by comparing response headers before and after it was added.
 */
const bcrypt = require('bcrypt');
const { registerSchema, loginSchema } = require('./validation/authSchemas');

async function main() {
  console.log('=== A. bcrypt: password hashing ===');
  const plain = 'BlueSky2026!';
  const hash = await bcrypt.hash(plain, 10);
  console.log('Plain text        :', plain);
  console.log('Stored hash       :', hash);
  console.log('compare(correct)  :', await bcrypt.compare(plain, hash));
  console.log('compare(wrong)    :', await bcrypt.compare('RedOcean2026!', hash));

  const hash2 = await bcrypt.hash(plain, 10);
  console.log('Same input again  :', hash2, '(random salt, so a different hash)');
  console.log('compare still OK  :', await bcrypt.compare(plain, hash2));

  console.log('\n=== B. Joi: schema validation (the project\'s own schemas) ===');
  const good = { name: 'AWD Demo', email: 'demo@test.com', password: 'BlueSky2026!' };
  console.log('Valid input       :', registerSchema.validate(good).error ? 'REJECTED' : 'ACCEPTED');

  const bad = { name: 'A', email: 'not-an-email', password: 'short' };
  const badResult = registerSchema.validate(bad, { abortEarly: false });
  console.log('Invalid input     : REJECTED ->', badResult.error.details.map((d) => d.message).join(' | '));

  const injection = { email: { $gt: '' }, password: { $gt: '' } };
  const injResult = loginSchema.validate(injection, { abortEarly: false });
  console.log('NoSQL injection   : REJECTED ->', injResult.error.details.map((d) => d.message).join(' | '));
}

main().catch((err) => { console.error(err); process.exit(1); });
