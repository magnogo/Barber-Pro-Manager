
# PROMPT MESTRE: BARBER PRO MANAGER SAAS

Crie uma plataforma SaaS completa para gerenciamento de redes de barbearias (Franqueador e Franqueados) chamada "Barber Pro Manager". O sistema deve ser robusto, multi-tenant e visualmente impactante.

### 🛠 TECH STACK
- **Frontend**: React.js (Vite), Tailwind CSS, Lucide React (Ícones).
- **Backend**: Node.js com Express.
- **Banco de Dados**: MySQL (Relacional).
- **IA**: Integração com Google Gemini API para insights de marketing e automação.

### 🏗 ARQUITETURA DE DADOS (MULTI-TENANT)
- Cada tabela deve possuir um campo `barbershop_id` (UUID).
- **Isolamento**: Um usuário de uma unidade jamais pode acessar dados de outra.
- **Hierarquia de Roles**: 
  1. `SUPER_ADMIN`: Gerencia a rede (todas as barbearias).
  2. `BARBERSHOP_ADMIN`: Dono/Gerente da unidade específica.
  3. `BARBER`: Profissional com acesso apenas à sua agenda.

### 📱 ESTRUTURA DE PÁGINAS E UI/UX
Design System: Estética "Dark Mode" para o Franqueador e "Modern Light/Clean" para as unidades, usando bordas arredondadas (rounded-[2.5rem]), sombras suaves e tipografia Inter.

1. **Página de Login**: Acesso centralizado com validação de Role.
2. **Dashboard (Franqueador)**: Kpis de faturamento da rede, número de unidades ativas e gestão de assinaturas (SaaS).
3. **Dashboard (Unidade)**: KPIs de faturamento diário, semanal e mensal. Insight de IA (Gemini) sobre performance.
4. **Agenda Master**: Grid de horários dinâmico por barbeiro. Suporte a Drag-and-drop e visualização por dia.
5. **Modo TV (Display)**: Interface de alto contraste para recepção mostrando "Em Atendimento" e "Próximos da Fila".
6. **CRM de Clientes**: Cadastro completo com foto, histórico de gastos e segmentação automática (VIP, Em Risco, Novo).
7. **Gestão de Equipe**: Controle de horários de trabalho, cargos e comissões.
8. **Catálogo de Serviços**: Gestão de preços e tempos de duração.
9. **Automação WhatsApp**: Configuração de fluxos de mensagens via IA Gemini.
10. **Link de Agendamento Público**: Página externa para clientes finais marcarem horário sem login.

### 🔗 RELACIONAMENTOS SQL (MySQL)
- `barbershops` (1) -> (N) `users`
- `barbershops` (1) -> (N) `clients`
- `barbershops` (1) -> (N) `services`
- `appointments` (N) -> (1) `barbershop`, (1) `barber`, (1) `client`, (1) `service`.

### 🤖 REQUISITOS DE IA
- Use a API do Gemini para:
  - Analisar dados de faturamento e dar dicas de gestão.
  - Gerar textos persuasivos para mensagens de WhatsApp de boas-vindas.
  - Sugerir estratégias de retenção para clientes "Em Risco".

**Instrução de Estilo**: O código deve ser modular, usando Context API para estado global e seguindo princípios de Clean Code.
