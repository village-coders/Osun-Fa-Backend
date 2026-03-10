const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const Club = mongoose.model('Club', new mongoose.Schema({}, { strict: false }));
    const club = await Club.findOne({ email: 'curltest@example.com' });
    if (club) {
        fs.writeFileSync('c:/Users/awwal/OneDrive/Desktop/Osun Fa/backend/my_token.txt', club.verificationToken);
    } else {
        const testclub = await Club.findOne({ email: 'testclub@example.com' });
        if (testclub) {
            fs.writeFileSync('c:/Users/awwal/OneDrive/Desktop/Osun Fa/backend/my_token.txt', testclub.verificationToken);
        }
    }
    process.exit(0);
});
