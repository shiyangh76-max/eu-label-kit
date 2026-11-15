#!/usr/bin/env node
// Generates license keys in the format the app accepts: ELK-XXXX-XXXX-XXXN
// Usage: node tools/keygen.mjs 20 > keys.txt
const n = Number(process.argv[2] || 10);
const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function g() { let s = ''; for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)]; return s; }
function key() {
  const a = g(), b = g();
  let sum = 0; const s = a + b;
  for (let i = 0; i < s.length; i++) sum = (sum * 31 + s.charCodeAt(i)) % 4096;
  return 'ELK-' + a + '-' + b + '-' + sum.toString(32).toUpperCase().padStart(3, '0') + A[Math.floor(Math.random() * A.length)];
}
for (let i = 0; i < n; i++) console.log(key());
