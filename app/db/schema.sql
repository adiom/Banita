CREATE TABLE IF NOT EXISTS banita (
  id SERIAL PRIMARY KEY,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

