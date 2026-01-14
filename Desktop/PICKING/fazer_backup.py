"""
Script de Backup do Banco de Dados - Pauliceia
Execute ANTES de atualizar o site
"""

import shutil
import os
from datetime import datetime
import sys

# Fix encoding para Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

DB_NAME = "pauliceia_web.db"
BACKUP_DIR = "backups"

def fazer_backup():
    """Faz backup do banco de dados"""

    print('='*60)
    print('💾 BACKUP DO BANCO DE DADOS - PAULICEIA')
    print('='*60)

    # Verifica se o banco existe
    if not os.path.exists(DB_NAME):
        print(f'\n❌ Arquivo {DB_NAME} não encontrado!')
        print('   Certifique-se de estar na pasta correta.')
        return False

    # Cria diretório de backups se não existir
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
        print(f'\n✅ Diretório {BACKUP_DIR}/ criado')

    # Nome do arquivo de backup com data e hora
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = os.path.join(BACKUP_DIR, f'pauliceia_web_{timestamp}.db')

    try:
        # Copia o banco de dados
        print(f'\n📦 Criando backup...')
        shutil.copy2(DB_NAME, backup_file)

        # Verifica tamanho
        size_original = os.path.getsize(DB_NAME)
        size_backup = os.path.getsize(backup_file)

        print(f'\n✅ Backup criado com sucesso!')
        print('='*60)
        print(f'Arquivo original: {DB_NAME}')
        print(f'Tamanho: {size_original:,} bytes')
        print(f'\nBackup salvo em: {backup_file}')
        print(f'Tamanho: {size_backup:,} bytes')
        print('='*60)

        # Lista backups existentes
        backups = sorted([f for f in os.listdir(BACKUP_DIR) if f.endswith('.db')])
        if len(backups) > 1:
            print(f'\n📁 Backups existentes ({len(backups)} arquivos):')
            for backup in backups[-5:]:  # Mostra últimos 5
                backup_path = os.path.join(BACKUP_DIR, backup)
                backup_size = os.path.getsize(backup_path)
                print(f'   • {backup} ({backup_size:,} bytes)')

        # Dica de restauração
        print('\n💡 Para restaurar este backup no futuro:')
        print(f'   cp {backup_file} {DB_NAME}')

        return True

    except Exception as e:
        print(f'\n❌ Erro ao criar backup: {e}')
        return False

if __name__ == "__main__":
    try:
        sucesso = fazer_backup()

        if sucesso:
            print('\n' + '='*60)
            print('✅ Backup concluído! Agora você pode atualizar o site.')
            print('='*60)
        else:
            print('\n' + '='*60)
            print('❌ Backup falhou. Não atualize o site ainda!')
            print('='*60)
            sys.exit(1)

    except KeyboardInterrupt:
        print('\n\n❌ Backup cancelado pelo usuário.')
        sys.exit(1)
    except Exception as e:
        print(f'\n❌ Erro inesperado: {e}')
        sys.exit(1)
