const { Permission, Role } = require('appwrite');
console.log(Permission.read(Role.user("123")));
