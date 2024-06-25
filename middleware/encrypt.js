const bcrypt = require('bcrypt');

class Encrypt{
    constructor() {
        this.saltRounds = 10;
    }
    static async hash(chr) {
        const salt = await bcrypt.genSalt(this.saltRounds);
        const hashed = await bcrypt.hash(chr, salt);
        return hashed;
    }
    static async check(plainPassword, hashedPassword) {
        const match = await bcrypt.compare(plainPassword, hashedPassword);
        return match;
    }
}
module.exports = Encrypt;