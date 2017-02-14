- Quand on cré certains élément sur l'app dont on aura besoin de récupérer l'id généré par le serveur (ex: nouveau register, nouveau CashMovement, nouveau Order), un id temporaire est créé dans l'élément et quand le serveur retourne le nouvel id, il est remplacé
On a besoin des ids pour les éléments suivants:
	- CashMovement: car on peut le deleter
	- Order: car on peut lui rajouter des Items, ... et ils doivent avoir l'id du Order
	- Register: car les Transactions et CashMovement ont besoin de son id
- Dans BusinessData, il est important de voir que c'est un arbre et non un graph: chaque élément est composé des éléments sous lui, il ne fait pas référence à des éléments à côtés de lui (ex: un Order a des Items qui on un Product, mais ce Product n'est pas une référence à un Product dans le array products)
	- Qu'en est-il de products et productCategories ?
