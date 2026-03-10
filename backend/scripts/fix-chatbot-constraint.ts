import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixConstraint() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Removing unique constraint on chatbot_conversations.user_id...');

    await pool.query(`
      ALTER TABLE "planning"."chatbot_conversations"
      DROP CONSTRAINT IF EXISTS "chatbot_conversations_user_id_key"
    `);

    console.log('Constraint removed successfully!');

    // Verify
    const result = await pool.query(`
      SELECT conname, contype
      FROM pg_constraint
      WHERE conrelid = '"planning"."chatbot_conversations"'::regclass
      AND contype = 'u'
    `);

    console.log('Remaining unique constraints:', result.rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

fixConstraint();
