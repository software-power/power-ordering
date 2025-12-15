import bcrypt from 'bcrypt';
const pwd = process.argv[2];
const run = async () => console.log(await bcrypt.hash(pwd, 12));
run();