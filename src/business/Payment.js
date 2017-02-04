/**
 * Represents a money transaction with a customer. If amount
 * is positive, it is a payment by the customer, if it is
 * negative, it is a reimbursement to the customer.
 */
class Payment {
	amount = null;
	paymentMode = null;
	datetime = null;
}

export default Payment;
