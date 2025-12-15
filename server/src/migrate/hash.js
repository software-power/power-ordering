
import bcrypt from 'bcrypt';
const pwd = process.argv[2] || 'power@123';
bcrypt.hash(pwd, 12).then(h => {
  console.log('Hash:', h);
});
