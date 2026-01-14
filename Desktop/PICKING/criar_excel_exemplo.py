"""
Script para criar arquivo Excel de exemplo para importação
"""
import pandas as pd

# Dados de exemplo
dados_exemplo = {
    'descricao': [
        'PRIMER 8200 CINZA',
        'CATALISADOR 8110',
        'LIXA P400',
        'LIXA P600',
        'THINNER 5000',
        'BASE BRANCA',
        'VERNIZ AUTOMOTIVO',
        'REMOVEDOR',
        'MASSA PLASTICA',
        'FLANELA',
        'ESPONJA ABRASIVA',
        'PISTOLA PINTURA',
        'FITA CREPE 18MM',
        'FITA CREPE 24MM',
        'PAPEL MASCARAMENTO'
    ],
    'endereco': [
        'RUA 1',
        'RUA 1',
        'RUA 2.A.1',
        'RUA 2.A.2',
        'RUA 3',
        'RUA 4',
        'RUA 4',
        'RUA 5',
        'RUA 6',
        'RUA 7',
        'RUA 7',
        'RUA 8',
        'RUA 9',
        'RUA 9',
        'RUA 9'
    ]
}

# Cria DataFrame
df = pd.DataFrame(dados_exemplo)

# Salva em Excel
df.to_excel('produtos_para_importar.xlsx', index=False)
print("✅ Arquivo 'produtos_para_importar.xlsx' criado com sucesso!")
print(f"📊 Total de {len(df)} produtos de exemplo criados")
print("\nVocê pode:")
print("1. Editar este arquivo com seus produtos reais")
print("2. Ou criar seu próprio arquivo com as colunas: descricao, endereco")
