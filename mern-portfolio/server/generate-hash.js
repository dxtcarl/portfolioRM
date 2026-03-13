const bcrypt = require('bcrypt');

const password = 'admin123';
const hash = bcrypt.hashSync(password, 10);
console.log('Password hash:', hash);
console.log('\nAdd this to your .env file:');
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
