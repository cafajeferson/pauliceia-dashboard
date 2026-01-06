#Faça um programa que leia o comprimento do cateto oposto e do cateto adjacente de um triângulo retângulo. Calcule e mostre o comprimento da hipotenusa.
from math import hypot

co = float(input('digite o cateto oposto: '))
ca = float(input('digite o cateto adjacente: '))
hi = hypot(co, ca)

print('A hipotenusa vai medir {:.2f}'.format(hi))

