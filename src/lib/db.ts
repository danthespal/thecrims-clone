import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL ?? '', {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
});

export default sql;
