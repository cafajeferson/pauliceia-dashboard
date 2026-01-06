#Faça um algoritmo que leia o salário de um funcionário e mostre seu novo salário, com 15% de aumento.

s = float(input('me fale seu salario: '))
a = s + (s * 15 / 100 )

print(' seu salario é R${:.2f}, e com um aumento de 15% vai para R${:.2f}'.format(s, a))