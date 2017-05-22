import { serializable } from 'serializr';
import Field from './Field';

/**
 * The PhoneField is a field for phone numbers. For now, we do not have any validation on the
 * format.
 */
class PhoneField extends Field {
	@serializable
	type = 'PhoneField';
}

export default PhoneField;
