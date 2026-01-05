
# Esquema SQL Profissional - Barber Pro Manager

## 1. Relacionamentos
- **1:N (One-to-Many)**: Uma `barbershop` possui muitos `users`, `clients`, `services` e `appointments`.
- **1:1 (One-to-One)**: Uma `barbershop` possui uma `whatsapp_config`.
- **M:N (Many-to-Many)**: Atendimentos (`appointments`) conectam `users` (barbeiros), `clients` e `services`.

## 2. Constraints de Segurança
- Toda query de leitura DEVE conter: `WHERE barbershop_id = [LOGGED_IN_SHOP_ID]`
- Operações de escrita em `users` exigem privilégio `BARBERSHOP_ADMIN` ou `SUPER_ADMIN`.

## 3. Comandos de Criação (Diferencial para Bold.new)
```sql
CREATE TABLE barbershops (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    plan VARCHAR(50),
    monthlyFee DECIMAL(10,2)
);

CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    barbershop_id VARCHAR(36),
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    role ENUM('SUPER_ADMIN', 'BARBERSHOP_ADMIN', 'BARBER'),
    FOREIGN KEY (barbershop_id) REFERENCES barbershops(id)
);

CREATE TABLE appointments (
    id VARCHAR(36) PRIMARY KEY,
    barbershop_id VARCHAR(36),
    barber_id VARCHAR(36),
    client_id VARCHAR(36),
    service_id VARCHAR(36),
    date DATE,
    time TIME,
    status ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'IN_PROGRESS'),
    FOREIGN KEY (barbershop_id) REFERENCES barbershops(id),
    FOREIGN KEY (barber_id) REFERENCES users(id)
);
```
