# desenvolva um programa que leia as duas notas de um aluno, calcula e mostre sua media.

n1 = float(input('digite sua primeira nota: '))
n2 = float(input('digite sua segunda nota: '))
s = (n1 + n2) / 2

print('a media entre {:.1f} e {:.1f} é igual a {:.1f}'.format(n1, n2, s ))