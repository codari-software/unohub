# Integração com Supabase - Plano de Implementação

## Objetivos
1. Configurar o cliente Supabase no projeto React.
2. Criar a tabela de banco de dados necessária.
3. Integrar o sistema de "Nova Transação" com o banco de dados.
4. Listar as transações vindas do banco.

## Passos

### 1. Instalação e Configuração
- [ ] Instalar a biblioteca `@supabase/supabase-js` na pasta `client`.
- [ ] Criar o arquivo `client/src/lib/supabase.ts` para inicializar o cliente.
- [ ] Criar arquivo `.env` para armazenar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

### 2. Banco de Dados (SQL)
Você precisará rodar este SQL no seu painel do Supabase (SQL Editor):
```sql
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  description text not null,
  amount numeric not null,
  type text check (type in ('income', 'expense')) not null,
  date timestamp with time zone not null,
  category text not null,
  is_recurring boolean default false,
  user_id uuid references auth.users(id), -- Opcional, se tiver autenticação
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

### 3. Integração no Frontend (Finance.tsx)
- [ ] Criar função `fetchTransactions` para buscar dados do Supabase.
- [ ] Substituir o mock `INITIAL_TRANSACTIONS` pelos dados reais.
- [ ] Atualizar `handleAddTransaction` para fazer o `insert` no Supabase.
- [ ] Adicionar estados de `loading` para feedback visual.

### 4. Integração de Categorias (Opcional/Melhoria)
- [ ] Persistir novas categorias no banco (ou usar uma tabela separada de categorias futuramente). Por enquanto, salvaremos apenas texto na transação.
