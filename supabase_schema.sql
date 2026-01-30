-- =============================================
-- SCHEMA DO BANCO DE DADOS - PAULICEIA TINTAS
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome TEXT UNIQUE NOT NULL
);

-- Tabela de Vendas
CREATE TABLE IF NOT EXISTS vendas (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id),
    arquivo_origem TEXT,
    mes_ref TEXT,
    produto TEXT,
    quantidade INTEGER,
    valor DECIMAL(10,2),
    ano_referencia INTEGER DEFAULT 2025
);

-- Tabela de Anos de Vendas
CREATE TABLE IF NOT EXISTS vendas_anos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    descricao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cliente_id, ano)
);

-- Tabela de Produtos Essenciais
CREATE TABLE IF NOT EXISTS essenciais (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id),
    produto TEXT,
    UNIQUE(cliente_id, produto)
);

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    login TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('admin', 'funcionario')),
    cargo TEXT DEFAULT 'colorista',
    ativo INTEGER DEFAULT 1,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Relatórios
CREATE TABLE IF NOT EXISTS relatorios (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    data_relatorio DATE NOT NULL,
    cliente_visitado TEXT,
    atividade_realizada TEXT,
    observacoes TEXT,
    texto_livre TEXT,
    destinatario TEXT DEFAULT 'admin',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Anotações
CREATE TABLE IF NOT EXISTS anotacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    titulo TEXT NOT NULL,
    conteudo TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Imagens das Anotações
CREATE TABLE IF NOT EXISTS anotacoes_imagens (
    id SERIAL PRIMARY KEY,
    anotacao_id INTEGER NOT NULL REFERENCES anotacoes(id) ON DELETE CASCADE,
    imagem BYTEA NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Fórmulas Personalizadas
CREATE TABLE IF NOT EXISTS formulas (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    conteudo TEXT,
    criado_por INTEGER NOT NULL REFERENCES usuarios(id),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_por INTEGER REFERENCES usuarios(id),
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Imagens das Fórmulas
CREATE TABLE IF NOT EXISTS formulas_imagens (
    id SERIAL PRIMARY KEY,
    formula_id INTEGER NOT NULL REFERENCES formulas(id) ON DELETE CASCADE,
    imagem BYTEA NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar usuário admin padrão
INSERT INTO usuarios (nome, login, senha, tipo, cargo)
VALUES ('Administrador', 'admin', 'admin123', 'admin', 'colorista')
ON CONFLICT (login) DO NOTHING;

-- Criar pasta de ano padrão
INSERT INTO vendas_anos (cliente_id, ano, descricao)
VALUES (0, 2025, 'Vendas 2025')
ON CONFLICT (cliente_id, ano) DO NOTHING;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_vendas_cliente ON vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vendas_ano ON vendas(ano_referencia);
CREATE INDEX IF NOT EXISTS idx_relatorios_usuario ON relatorios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_data ON relatorios(data_relatorio);
CREATE INDEX IF NOT EXISTS idx_anotacoes_usuario ON anotacoes(usuario_id);
