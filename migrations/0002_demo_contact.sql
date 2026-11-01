-- Estrutura já existente em src/db/schema.ts, preparada também no banco isolado.
CREATE TABLE IF NOT EXISTS contact_messages (
  id serial PRIMARY KEY,
  origin varchar(20) NOT NULL DEFAULT 'contato',
  name varchar(160) NOT NULL,
  email varchar(160) NOT NULL,
  phone varchar(40),
  company varchar(160),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
