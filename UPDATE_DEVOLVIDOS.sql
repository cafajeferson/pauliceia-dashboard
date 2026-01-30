-- =============================================
-- ATUALIZAÇÃO: SISTEMA DE DEVOLUÇÃO
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- 1. Adicionar coluna 'devolvido' e 'data_devolucao' na tabela DEVEMOS
ALTER TABLE devemos ADD COLUMN IF NOT EXISTS devolvido BOOLEAN DEFAULT FALSE;
ALTER TABLE devemos ADD COLUMN IF NOT EXISTS data_devolucao TIMESTAMP;

-- 2. Adicionar coluna 'devolvido' e 'data_devolucao' na tabela MATERIAIS_EMPRESTADOS
ALTER TABLE materiais_emprestados ADD COLUMN IF NOT EXISTS devolvido BOOLEAN DEFAULT FALSE;
ALTER TABLE materiais_emprestados ADD COLUMN IF NOT EXISTS data_devolucao TIMESTAMP;

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_devemos_devolvido ON devemos(devolvido);
CREATE INDEX IF NOT EXISTS idx_materiais_emprestados_devolvido ON materiais_emprestados(devolvido);

-- Verificar se as colunas foram criadas
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns
WHERE table_name IN ('devemos', 'materiais_emprestados')
AND column_name IN ('devolvido', 'data_devolucao')
ORDER BY table_name, column_name;
