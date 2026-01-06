#O mesmo professor do desafio 19 quer sortear a ordem de apresentação de trabalhos dos alunos. Faça um programa que leia o nome dos quatro alunos e mostre a ordem sorfro


from random import shuffle
n1 = str(input('Primeiro nome: '))
n2 = str(input('Segundo nome: '))
n3 = str(input('Terceiro nome: '))
n4 = str(input('Terceiro nome: '))
lsita =[n1, n2, n3, n4]
shuffle(lsita)
print(' a ordem da apresentação sera: ')
print(lsita)