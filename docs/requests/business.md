Données retournées quand le device demande les infos du device
===
{
	device_register: {
		cash_transactions: {
			[id]: {
				amount,
				description
			}
		}
	},
	transaction_modes: {
		[id]: {
			name
		}
	},
	products: {
		[id]: {
			name,
			description,
			price, (à moins d'avoir des variantes; avant taxes)
			taxes: [ (à moins d'avoir des variantes)
				{name:..., amount: ...}
			],
			variant_ids: [...]
			parent_id: ... (si c'est une variante)
		}
	},
	product_categories: {
		[id]: {
			name,
			product_ids: [...]
		}
	}
}
