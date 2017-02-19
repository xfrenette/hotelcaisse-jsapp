Structure des tables MySQL
===

businesses
	id
	name
	locale
	active_register_id (donc tous les devices ont le même registre; si un jour besoin de plusieurs registres, on pourra faire une table active_registers)
	data_version (à chaque modification des données de la business -- nouveau produit, nouveau prix, register qui se ferme, ... -- ce chiffre est incrémenté. Quand un device fait une requête, il passe le dernier data_version reçu et s'ils sont différents, le serveur renvoie toutes les données, sinon il ne retourne rien)

products
	id
	business_id
	name
	type: {PRODUCT, VARIANT}
	parent_product_id (si le type est VARIANT)
	price (ignoré si a des VARIANT)
	price_includes_taxes (bool)

product_taxes
	id
	product_id
	tax_id
	type: si on veut redéfinir le type
	amount: si on veut redéfinir le amount

product_categories
	id
	business_id

product_categories_products
	id
	product_id
	product_category_id

taxes
	id
	name
	amount
	type: {PERCENTAGE, FIXED}

orders
	id
	business_id
	created_at
	note

credits
	id
	created_at
	order_id
	amount
	note

transactions (échange d'argent)
	id
	created_at (des paiements pourraient être ajoutés plus tard)
	order_id
	transaction_mode
	amount (peut être négatif pour remboursement)
	note
	register_id

items (pour ajout ou remboursement)
	id
	order_id
	created_at (des items pourraient être rajoutés plus tard)
	original_product_id (pour pouvoir regrouper ensemble les items qui représentent le même produit, mais pas pour accéder à ses infos, sera à null si c'est un item
	custom)
	name (nom original du produit, ou nom donné à l'item custom)
	quantity (négatif si remboursement)
	totalPrice (avant taxe)
	totalTax
	total (somme de totalPrice et totalTax)

item_taxes
	id
	item_id
	original_tax_id (pour regrouper ensemble, pas pour accéder aux infos)
	tax_name
	total

transaction_modes
	id
	type: {CASH, CARD}
	name
	business_id

registers
	id
	employee
	status: {OPENED, CLOSED}
	business_id
	opened_at
	closed_at
	opening_cash_amount
	closing_cash_amount
	post_batch_number
	post_batch_amount

cash_movement
	id
	register_id
	amount
	description

devices
	id
	name
	created_at
	business_id

sessions
	device_id
	token

authentications
	id
	created_at
	expires_at (5 minutes)
	code (4 chiffre)
	business_id
