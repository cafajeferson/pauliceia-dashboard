#Crie um programa que leia quanto dinheiro uma pessoa tem na carteira e mostre quantos Dólares ela pode comprar.

r = float(input('quanto dinheiro voce tem na carteira?  R$'))

d = r / 3.27
e = r / 4.21
y = r / 3.12

print('com R${:.2f} voce pode comprar: \nUS${:.2f},\nER${:.2f}, \nyn${:.2f} '.format(r , d, e, y))






