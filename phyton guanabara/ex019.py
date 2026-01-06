#Um professor quer sortear um dos seus quatro alunos para apagar o quadro. Faça um programa que ajude ele, lendo o nome dos alunos e escrevendo na tela o nome do escolhido.
import random
n1 = 'pedro'
n2 = 'joao'
n3 = 'jose'
n4 = 'maria'
n5 = 'marcia'
n6 = 'jef'
n7 = 'montanha'
n8 = 'lion'
n9 = 'cat'
n10 = 'bob'
n11 = 'marley'
n12 = 'shirley'





lista = [n1, n2, n3, n4, n5, n6, n7, n8, n9, n10, n11, n12]
escolhido = random.choice(lista)
print(' o aluno escolhido foi {}'.format(escolhido))
