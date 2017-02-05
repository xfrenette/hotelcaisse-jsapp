// TODO
import { observable } from 'mobx';

/**
 * Represents all the money ins and outs of a business day
 * (or a business unit period). Records payments (cash and
 * cards) and inputs/outputs of cash for any reason.
 *
 * Note: POST = Point Of Sale Terminal (credit cards terminal)
 */
class Register {
	state = STATES.NEW;
	employee = '';
	opening: {
		datetime: null,
		declaredCash: null,
	};
	closing: {
		datetime: null,
		declaredCash: null,
		POSTRef: null,
		POSTAmount: null,
	};
	cashMovements = [];

	/**
	 * Sets the Register as opened and saves opening data.
	 *
	 * @param {String} employee Employee's name
	 * @param {Decimal} cashAmount
	 */
	open(employee, cashAmount) {
		// this... = ...
		// this.state = STATES.OPENED
	}

	/**
	 * Sets the Register as closed and saves closing data.
	 *
	 * @param {Decimal} cashAmount
	 * @param {String} POSTRef POST batch reference number
	 * @param {Decimal} POSTAmount POST batch total
	 */
	close(cashAmount, POSTRef, POSTAmount) {

	}

}

export default Register;
export const STATES = {
	NEW: 0,
	OPENED: 1,
	CLOSED: 2,
};
