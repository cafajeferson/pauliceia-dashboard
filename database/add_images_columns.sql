-- Adicionar coluna de imagens nas tabelas existentes

-- Tabela de relatórios
ALTER TABLE relatorios ADD COLUMN IF NOT EXISTS imagens TEXT[];

-- Tabela de anotações
ALTER TABLE anotacoes ADD COLUMN IF NOT EXISTS imagens TEXT[];

-- Tabela de tintas personalizadas
ALTER TABLE tintas_personalizadas ADD COLUMN IF NOT EXISTS imagens TEXT[];

-- Configuração de Storage Buckets (executar no Supabase Dashboard > Storage)
-- Criar três buckets públicos:
-- 1. relatorios
-- 2. anotacoes
-- 3. tintas

-- Políticas de Storage (aplicar em cada bucket)
-- Permitir upload autenticado:
-- INSERT: authenticated users can upload
-- SELECT: public can view
-- DELETE: authenticated users can delete their own files
