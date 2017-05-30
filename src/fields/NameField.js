import { serializable } from 'serializr';
import Field from './Field';

/**
 * The NameField is a field for proper names. For now, we do not have any validation on the
 * format.
 */
class NameField extends Field {
	@serializable
	type = 'NameField';
}

export default NameField;
