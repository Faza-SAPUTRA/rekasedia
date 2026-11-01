-- Identitas Telegram per user
-- Dipakai supaya bot bisa nge-tag guru di grup (username) dan/atau kirim DM (chat_id).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(64) DEFAULT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(64) DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_telegram_chat_id_key
  ON users (telegram_chat_id)
  WHERE telegram_chat_id IS NOT NULL;
