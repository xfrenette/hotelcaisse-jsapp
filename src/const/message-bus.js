export const CHANNELS = {
	register: 'register',
	business: 'business',
	order: 'order',
};

export const TOPICS = {
	register: {
		opened: 'opened',
		closed: 'closed',
		cashMovement: {
			added: 'cashMovement.added',
		},
	},
	business: {
		order: {
			added: 'order.added',
		},
	},
	order: {
		saved: 'saved',
		item: {
			added: 'item.added',
		},
		credit: {
			added: 'credit.added',
		},
		transaction: {
			added: 'transaction.added',
		},
	},
};
