# Crie um programa que leia um número Real qualquer pelo teclado e mostre na tela a sua porção Inteira.

import math  #inporta tudo
from math import trunc #inportou so  a função trunc


num = float(input('digite um valor: '))
print('o valor digitado foi {} e a sua porção inteira é {}'.format(num, trunc(num)))
