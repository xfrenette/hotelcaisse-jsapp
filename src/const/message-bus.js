export const CHANNELS = {
	register: 'register',
	business: 'business',
	order: 'order',
	api: 'api',
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
	api: {
		dataReceived: {
			success: 'dataReceived.success',
			error: 'dataReceived.error',
		},
	},
};
