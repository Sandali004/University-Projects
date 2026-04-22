import bcrypt from 'bcryptjs';

async function testBcrypt() {
    const password = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    console.log('Password:', password);
    console.log('Salt:', salt);
    console.log('Hash:', hash);
    
    const isMatch = await bcrypt.compare(password, hash);
    console.log('Match result (correct password):', isMatch);
    
    const isWrongMatch = await bcrypt.compare('wrongpassword', hash);
    console.log('Match result (wrong password):', isWrongMatch);
}

testBcrypt();
