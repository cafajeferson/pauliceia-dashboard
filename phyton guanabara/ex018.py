#Faça um programa que leia um ângulo qualquer e mostre na tela o valor do seno, cosseno e tangente desse ângulo.

import math
angulo = float(input('digite o angulo: '))
sen = math.sin(math.radians(angulo))
co = math.cos(math.radians(angulo))
tan = math.tan(math.radians(angulo))
print('O angulo {} tem o valor {:.2f}'.format(angulo, sen))
print('O angulo {} tem o valor {:.2f}'.format(angulo, co))
print('O angulo {} tem o valor {:.2f}'.format(angulo, tan))
