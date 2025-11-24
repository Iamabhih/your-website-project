-- Add missing columns to chat_sessions table
ALTER TABLE chat_sessions
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add missing column to chat_messages table
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_rating ON chat_sessions(rating) WHERE rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_sessions_priority ON chat_sessions(priority);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_is_starred ON chat_sessions(is_starred) WHERE is_starred = true;
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON chat_messages(is_read, session_id) WHERE is_read = false;