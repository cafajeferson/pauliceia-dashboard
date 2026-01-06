#escreva um programa que leia um valor em metros e o exiba convertido em centimetros e milimitros.

medida = float(input('uma distancia em metros: '))
cm = medida * 100
mm = medida * 1000


print('a medida de {}m corresponde a {:.0f}cm e {:.0f}mm'.format(medida, cm, mm))