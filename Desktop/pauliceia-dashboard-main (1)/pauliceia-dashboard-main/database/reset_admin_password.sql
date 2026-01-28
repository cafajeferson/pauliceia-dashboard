-- Reset Admin Password
-- Execute este script no SQL Editor do Supabase para resetar a senha do admin

-- Atualiza a senha do admin para "admin123"
UPDATE usuarios 
SET senha = 'admin123'
WHERE login = 'admin';

-- Verificar se a atualização foi bem-sucedida
SELECT id, nome, login, tipo, ativo 
FROM usuarios 
WHERE login = 'admin';
