/**
 * Migration: Add gemini_api_key and ai_auto_reply_enabled to users table
 */
import sequelize from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  try {
    await sequelize.query('ALTER TABLE users ADD COLUMN gemini_api_key VARCHAR(255) NULL');
    console.log('Added gemini_api_key');
  } catch (e) {
    if (e.message?.includes('Duplicate column')) {
      console.log('gemini_api_key already exists');
    } else throw e;
  }
  try {
    await sequelize.query('ALTER TABLE users ADD COLUMN ai_auto_reply_enabled TINYINT(1) DEFAULT 0');
    console.log('Added ai_auto_reply_enabled');
  } catch (e) {
    if (e.message?.includes('Duplicate column')) {
      console.log('ai_auto_reply_enabled already exists');
    } else throw e;
  }
  try {
    await sequelize.close();
  } catch (_) {}
  console.log('Migration complete');
};

run().catch((e) => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
