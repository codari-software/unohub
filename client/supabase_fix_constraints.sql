-- 1. Limpar tabela de meses processados para evitar conflitos de migração
TRUNCATE TABLE processed_months;

-- 2. Garantir que user_id não aceite nulos (importante para segurança)
ALTER TABLE processed_months ALTER COLUMN user_id SET NOT NULL;

-- 3. Remover a chave primária antiga (que provavelmente era só 'month_key')
ALTER TABLE processed_months DROP CONSTRAINT IF EXISTS processed_months_pkey;

-- 4. Criar nova chave primária composta (user_id + month_key)
-- Isso permite que o usuário A processe '2026-01' e o usuário B também processe '2026-01' sem conflito
ALTER TABLE processed_months ADD PRIMARY KEY (user_id, month_key);
