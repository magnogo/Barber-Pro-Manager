
# RELACIONAMENTOS E INTEGRIDADE SQL

Para garantir que o sistema seja um SaaS escalonável, siga estas regras de banco de dados:

### 1. Tabela `barbershops`
- **Chave Primária**: `id` (UUID).
- **Campos**: `slug` (para o link de agendamento), `plan_type` (Controle de funcionalidades).

### 2. Tabela `users`
- **Chave Estrangeira**: `barbershop_id` referenciando `barbershops(id)`.
- **Campos de Agenda**: `work_days` (JSON: [1,2,3,4,5]), `start_time`, `end_time`.

### 3. Tabela `appointments` (Tabela Fato)
- **Relacionamentos**:
  - `barber_id` -> `users(id)`
  - `client_id` -> `clients(id)`
  - `service_id` -> `services(id)`
- **Constraint**: `ON DELETE RESTRICT` (Não permitir apagar um serviço ou barbeiro que tenha agendamentos vinculados sem antes tratar os dados).

### 4. Consultas Multi-tenant (Segurança)
Toda query SQL executada pelo backend deve incluir obrigatoriamente:
`SELECT * FROM table_name WHERE barbershop_id = ?`

Isso previne o "Data Leaking" entre diferentes unidades da franquia.
