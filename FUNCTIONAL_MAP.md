
# MAPA FUNCIONAL - BARBER PRO MANAGER

Este documento descreve o comportamento esperado de cada módulo do sistema.

### 1. Módulo de Autenticação
- **Funcionalidade**: Login via JWT.
- **Redirecionamento**:
  - Super Admin -> `/super-admin` (Visão de Rede).
  - Admin Unidade -> `/dashboard` (Visão de Loja).
  - Barbeiro -> `/schedule` (Apenas sua agenda).

### 2. Módulo de Agenda (Core)
- **Grid**: 8:00 às 21:00 (ajustável por unidade).
- **Lógica de Conflito**: Não permitir dois agendamentos no mesmo horário para o mesmo barbeiro.
- **Cálculo de Fim**: Horário de Início + Duração do Serviço.
- **Status**: Pendente, Confirmado, Em Atendimento, Concluído, Cancelado.

### 3. Modo TV (Display de Alto Impacto)
- **Público**: Clientes na recepção.
- **Comportamento**: Atualização automática (Pooling a cada 60s).
- **Visual**: Cards grandes, status coloridos (Vermelho = Ocupado, Verde = Disponível).

### 4. Gestão Financeira (BI)
- **Métricas**: Faturamento Bruto, Ticket Médio por Barbeiro, Taxa de Ocupação da Cadeira.
- **Exportação**: Gerar relatório de fechamento para pagamento de comissões.

### 5. Automação de Marketing (IA)
- **Integração Gemini**: O sistema envia os dados dos últimos 30 dias para a IA, que retorna um parágrafo estratégico para o gestor.
- **Templates**: Geração de mensagens personalizadas: "Olá [NOME], faz 20 dias que você não vem..."
