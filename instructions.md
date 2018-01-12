Sources :
https://github.com/ProjectNapoleonX/SmartContract-ICO
Smart contract :
oracle : 0xd2330863dc0d4d4571fcdc851fede2af95815d66
token : 0xc3788c1d348aef1a314bca5085c8285acc269030

Fonctionalités du nouveau smart contract à déveloper:
1) Contient une liste d'adresses eth autorisées (possibilité d'en ajouter pour l'instantiateur du contrat)
2) Contient un mapping entre les adresses des gens non autorisés qui ont envoyé de l'argent et le montant envoyé

3) Lorsque l'une transaction arrive sur le contrat, deux cas:
   - Si l'adresse est autorisée, alors transfert vers le wallet final
   - Sinon, l'argent reste sur le smart contract et le mapping adresse -> montant est ajouté à la map cité au point 2)
   
4) Lorsqu'on appelle la méthode pour autoriser une adresse, on vérifie dans la map citée en 2)
que la personne n'a pas déjà envoyé le cash. Si oui, le montant dans la map passe à 0
et l'argent est transférée vers le wallet final.

5) Une méthode refoundNotAuthorized est présente, lorsqu'elle est appelée,
ca regarde le montant dans la map associé à l'adresse appelant, si > 0 alors ca lui renvoie le cash et met 0 dans la map


Fonctionalités du site web : embedded payment module on website
Permettre aux utilisateurs d'envoyer les paiements ethers depuis notre site



il faudra bien enlever 56d7f7afc8f1ca890a8b0a72043108c2240e6fee
