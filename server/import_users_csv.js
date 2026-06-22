import fs from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import pool from './db.js';

const csvPath = path.resolve(process.argv[2] || 'listUser.csv');

function parseSemicolonCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ';' && !quoted) {
      row.push(value.trim());
      value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(value.trim());
      value = '';
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
    } else {
      value += char;
    }
  }

  row.push(value.trim());
  if (row.some((cell) => cell !== '')) rows.push(row);
  return rows;
}

function normalizeKey(value) {
  return value.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeAscii(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function nameWithoutDegree(fullName) {
  return fullName.split(',')[0].trim();
}

function makeEmail(fullName) {
  const slug = normalizeAscii(nameWithoutDegree(fullName))
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '');
  return `${slug}@rekasedia.sch.id`;
}

function makeDefaultPassword(fullName) {
  const firstName = nameWithoutDegree(fullName).split(/\s+/)[0];
  const normalized = normalizeAscii(firstName).replace(/[^a-z0-9]/g, '');
  if (!normalized) throw new Error(`Tidak dapat membuat password untuk nama: ${fullName}`);
  return `${normalized}123`;
}

function assertUnique(records, field) {
  const seen = new Set();
  for (const record of records) {
    if (seen.has(record[field])) throw new Error(`Data ${field} duplikat: ${record[field]}`);
    seen.add(record[field]);
  }
}

async function loadUsers() {
  const raw = (await fs.readFile(csvPath, 'utf8')).replace(/^\uFEFF/, '');
  const rows = parseSemicolonCsv(raw);
  if (rows.length < 2) throw new Error('CSV kosong atau tidak memiliki baris data.');

  const headers = rows[0].map(normalizeKey);
  const nameIndex = headers.indexOf('nama');
  const nipIndex = headers.findIndex((header) => header.includes('nipppk') || header === 'nip');
  const departmentIndex = headers.findIndex((header) => header.includes('gurukelas') || header.includes('matapelajaran'));

  if (nameIndex < 0 || nipIndex < 0 || departmentIndex < 0) {
    throw new Error('Header wajib tidak ditemukan: Nama, NIPPPK (NRP), dan Guru Kelas / Mata Pelajaran.');
  }

  const records = rows.slice(1).map((row, index) => {
    const fullName = row[nameIndex]?.trim();
    const nip = row[nipIndex]?.trim();
    const department = row[departmentIndex]?.trim();

    if (!fullName || !/^\d{8,20}$/.test(nip || '')) {
      throw new Error(`Data nama/NIP tidak valid pada baris ${index + 2}.`);
    }

    return {
      fullName,
      nip,
      department: department || 'Guru',
      email: makeEmail(fullName),
      password: makeDefaultPassword(fullName),
    };
  });

  assertUnique(records, 'nip');
  assertUnique(records, 'email');
  return records;
}

async function importUsers() {
  const records = await loadUsers();
  const prepared = await Promise.all(records.map(async (record) => ({
    ...record,
    passwordHash: await bcrypt.hash(record.password, 10),
  })));

  const client = await pool.connect();
  let inserted = 0;
  let updated = 0;

  try {
    await client.query('BEGIN');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS nip VARCHAR(30)');
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS users_nip_unique ON users (nip)');

    for (const user of prepared) {
      const existing = await client.query(
        'SELECT id FROM users WHERE nip = $1 OR LOWER(email) = $2 ORDER BY id',
        [user.nip, user.email]
      );

      if (existing.rows.length > 1) {
        throw new Error(`Konflik akun untuk NIP ${user.nip}; ditemukan lebih dari satu user.`);
      }

      if (existing.rows.length === 1) {
        await client.query(
          `UPDATE users
           SET full_name = $1, email = $2, nip = $3, password_hash = $4,
               role = 'guru', department = $5, updated_at = CURRENT_TIMESTAMP
           WHERE id = $6`,
          [user.fullName, user.email, user.nip, user.passwordHash, user.department, existing.rows[0].id]
        );
        updated += 1;
      } else {
        await client.query(
          `INSERT INTO users (full_name, email, nip, password_hash, role, department)
           VALUES ($1, $2, $3, $4, 'guru', $5)`,
          [user.fullName, user.email, user.nip, user.passwordHash, user.department]
        );
        inserted += 1;
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  const verification = await pool.query(
    'SELECT nip, password_hash FROM users WHERE nip = ANY($1::text[])',
    [prepared.map((user) => user.nip)]
  );
  const passwordByNip = new Map(prepared.map((user) => [user.nip, user.password]));
  const passwordChecks = await Promise.all(verification.rows.map((user) => (
    bcrypt.compare(passwordByNip.get(user.nip), user.password_hash)
  )));

  if (verification.rows.length !== prepared.length || passwordChecks.some((valid) => !valid)) {
    throw new Error('Verifikasi akhir user/password gagal.');
  }

  return { total: prepared.length, inserted, updated, verified: verification.rows.length };
}

try {
  const result = await importUsers();
  console.log(JSON.stringify(result));
} catch (error) {
  console.error('Import user gagal:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
