-- =============================================
-- SCRIPT: Atualizar Nomes dos Produtos
-- Execute este SQL no Supabase para atualizar os nomes
-- =============================================

-- Verificar quantos produtos existem
SELECT COUNT(*) as total, 
       COUNT(CASE WHEN codigo = nome THEN 1 END) as sem_nome,
       COUNT(CASE WHEN codigo != nome THEN 1 END) as com_nome
FROM produtos;

-- Ver os primeiros 20 produtos sem nome
SELECT codigo, nome 
FROM produtos 
WHERE codigo = nome 
LIMIT 20;

-- =============================================
-- OPÇÃO 1: Atualizar produtos manualmente (exemplo)
-- =============================================

-- Exemplo de como atualizar produtos individuais:
-- UPDATE produtos SET nome = 'FINESSE IT 500ML 3M' WHERE codigo = '00.00.001';
-- UPDATE produtos SET nome = 'ESPUMA ABRASIVA N°5 P1200-P1500 NORTON' WHERE codigo = '00.00.065';

-- =============================================
-- OPÇÃO 2: Atualizar em lote via CSV
-- =============================================

-- Se você tiver um arquivo CSV com codigo,nome
-- Pode usar o Table Editor do Supabase para importar

-- =============================================
-- OPÇÃO 3: Script de exemplo para produtos comuns
-- =============================================

-- Adicione seus produtos aqui seguindo o padrão:
UPDATE produtos SET nome = 'NOME DO PRODUTO 1' WHERE codigo = 'CODIGO_1';
UPDATE produtos SET nome = 'NOME DO PRODUTO 2' WHERE codigo = 'CODIGO_2';
-- ... adicione mais conforme necessário

-- =============================================
-- VERIFICAÇÃO FINAL
-- =============================================

-- Ver produtos atualizados
SELECT codigo, nome 
FROM produtos 
WHERE codigo != nome 
ORDER BY nome;
