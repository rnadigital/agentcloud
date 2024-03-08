import Permission from '@permission';
import Permissions from 'permissions/permissions';

const Roles: any = Object.seal(Object.freeze(Object.preventExtensions({

	ROOT: new Permission([Permissions.ROOT]),

	NOT_LOGGED_IN: new Permission([Permissions.TESTING]),

	TESTING: new Permission([Permissions.TESTING]),

})));

export default Roles;
