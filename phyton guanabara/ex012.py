#Faça um algoritmo que leia o preço de um produto e mostre seu novo preço, com 5% de desconto.

p = float(input('digite o preço do produto: R$'))
n = p - (p *5 / 100)
print('o produto que custava R${:.2f}, na promoção de 5% vai custar R${:.2f}'.format(p , n))





