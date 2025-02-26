import { createPool } from '@vercel/postgres';

export const db = createPool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: true
  }
});

// Альтернативный вариант с отдельными параметрами
// export const db = createPool({
//   host: process.env.PGHOST,
//   user: process.env.PGUSER,
//   password: process.env.PGPASSWORD,
//   database: process.env.PGDATABASE,
//   ssl: {
//     rejectUnauthorized: true
//   }
// });