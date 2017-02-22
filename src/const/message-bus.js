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
			removed: 'cashMovement.removed',
		},
	},
	business: {
		order: {
			added: 'order.added',
		},
	},
	order: {
		modified: 'modified',
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
