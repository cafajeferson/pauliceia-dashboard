-- =============================================
-- MIGRATION: Dashboard Improvements
-- Date: 2026-01-26
-- Description: Adds produtos table and report archiving functionality
-- =============================================

-- 1. Create produtos table for product code to name mapping
CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add archiving columns to relatorios table
ALTER TABLE relatorios 
ADD COLUMN IF NOT EXISTS arquivado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS data_arquivamento TIMESTAMP;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_relatorios_arquivado ON relatorios(arquivado);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos(codigo);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);

-- 4. Populate produtos table with existing product codes from vendas
-- This creates initial records with codigo = nome (user will update names later)
INSERT INTO produtos (codigo, nome, descricao)
SELECT DISTINCT 
    produto as codigo, 
    produto as nome,
    'Produto importado automaticamente' as descricao
FROM vendas
WHERE produto IS NOT NULL 
  AND produto != ''
ON CONFLICT (codigo) DO NOTHING;

-- 5. Add trigger to update atualizado_em on produtos
CREATE OR REPLACE FUNCTION update_produtos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_produtos_timestamp
    BEFORE UPDATE ON produtos
    FOR EACH ROW
    EXECUTE FUNCTION update_produtos_timestamp();

-- 6. Add comment to help users understand the migration
COMMENT ON TABLE produtos IS 'Tabela de produtos para mapear códigos para nomes legíveis';
COMMENT ON COLUMN produtos.codigo IS 'Código do produto (ex: 00.00.001)';
COMMENT ON COLUMN produtos.nome IS 'Nome legível do produto (ex: FINESSE IT 500ML 3M)';
COMMENT ON COLUMN relatorios.arquivado IS 'Indica se o relatório foi arquivado';
COMMENT ON COLUMN relatorios.data_arquivamento IS 'Data e hora do arquivamento';

-- =============================================
-- VERIFICATION QUERIES
-- Run these to verify the migration worked:
-- =============================================

-- Check produtos table
-- SELECT COUNT(*) as total_produtos FROM produtos;
-- SELECT * FROM produtos LIMIT 10;

-- Check relatorios columns
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'relatorios' AND column_name IN ('arquivado', 'data_arquivamento');

-- Check indexes
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('produtos', 'relatorios');
