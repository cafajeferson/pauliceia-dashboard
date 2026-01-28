-- ============================================
-- CONFIGURAÇÃO CORRIGIDA - POLÍTICAS DE STORAGE
-- Execute DEPOIS de criar os 3 buckets manualmente
-- ============================================

-- PARTE 1: Adicionar colunas (se ainda não fez)
-- ============================================
ALTER TABLE relatorios ADD COLUMN IF NOT EXISTS imagens TEXT[];
ALTER TABLE anotacoes ADD COLUMN IF NOT EXISTS imagens TEXT[];
ALTER TABLE tintas_personalizadas ADD COLUMN IF NOT EXISTS imagens TEXT[];

-- PARTE 2: REMOVER políticas antigas (se existirem)
-- ============================================
DROP POLICY IF EXISTS "Allow authenticated uploads relatorios" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access relatorios" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete relatorios" ON storage.objects;

DROP POLICY IF EXISTS "Allow authenticated uploads anotacoes" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access anotacoes" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete anotacoes" ON storage.objects;

DROP POLICY IF EXISTS "Allow authenticated uploads tintas" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access tintas" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete tintas" ON storage.objects;

-- PARTE 3: CRIAR políticas CORRETAS
-- ============================================

-- BUCKET: relatorios
-- ============================================

-- Permitir QUALQUER PESSOA fazer upload (INSERT)
CREATE POLICY "Allow all uploads relatorios" 
ON storage.objects FOR INSERT 
TO public
WITH CHECK (bucket_id = 'relatorios');

-- Permitir QUALQUER PESSOA ver arquivos (SELECT)
CREATE POLICY "Allow public read relatorios" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'relatorios');

-- Permitir QUALQUER PESSOA deletar (DELETE)
CREATE POLICY "Allow all delete relatorios" 
ON storage.objects FOR DELETE 
TO public
USING (bucket_id = 'relatorios');

-- BUCKET: anotacoes
-- ============================================

CREATE POLICY "Allow all uploads anotacoes" 
ON storage.objects FOR INSERT 
TO public
WITH CHECK (bucket_id = 'anotacoes');

CREATE POLICY "Allow public read anotacoes" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'anotacoes');

CREATE POLICY "Allow all delete anotacoes" 
ON storage.objects FOR DELETE 
TO public
USING (bucket_id = 'anotacoes');

-- BUCKET: tintas
-- ============================================

CREATE POLICY "Allow all uploads tintas" 
ON storage.objects FOR INSERT 
TO public
WITH CHECK (bucket_id = 'tintas');

CREATE POLICY "Allow public read tintas" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'tintas');

CREATE POLICY "Allow all delete tintas" 
ON storage.objects FOR DELETE 
TO public
USING (bucket_id = 'tintas');

-- ============================================
-- FIM - Agora deve funcionar!
-- ============================================
