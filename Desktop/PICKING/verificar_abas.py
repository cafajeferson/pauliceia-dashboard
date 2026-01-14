import pandas as pd

xls = pd.ExcelFile('produtos/estoque.xls')

print('Abas/Sheets encontradas:')
for sheet in xls.sheet_names:
    print(f'  - {sheet}')

print('\n' + '='*60)
print('Vou verificar cada aba...')
print('='*60)

for sheet in xls.sheet_names:
    df = pd.read_excel('produtos/estoque.xls', sheet_name=sheet)
    print(f'\nAba: {sheet}')
    print(f'Total de linhas: {len(df)}')
    print(f'Colunas: {df.columns.tolist()}')
    print(f'Primeiras 3 linhas:')
    print(df.head(3))
