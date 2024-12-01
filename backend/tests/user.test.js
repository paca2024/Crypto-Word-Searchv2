const mongoose = require('mongoose');
const User = require('../models/User');

describe('User Model Test', () => {
    beforeAll(async () => {
        await mongoose.connect(global.__MONGO_URI__, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('should create & save user successfully', async () => {
        const validUser = new User({
            username: 'testuser',
            email: 'test@test.com',
            password: 'password123'
        });
        const savedUser = await validUser.save();
        
        expect(savedUser._id).toBeDefined();
        expect(savedUser.username).toBe(validUser.username);
        expect(savedUser.email).toBe(validUser.email);
        expect(savedUser.password).not.toBe('password123'); // Should be hashed
    });

    it('should fail to save user without required fields', async () => {
        const userWithoutRequiredField = new User({ username: 'test' });
        let err;
        
        try {
            await userWithoutRequiredField.save();
        } catch (error) {
            err = error;
        }
        
        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it('should fail to save user with invalid email', async () => {
        const userWithInvalidEmail = new User({
            username: 'test',
            email: 'invalid-email',
            password: 'password123'
        });
        let err;
        
        try {
            await userWithInvalidEmail.save();
        } catch (error) {
            err = error;
        }
        
        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it('should correctly compare passwords', async () => {
        const user = new User({
            username: 'testuser2',
            email: 'test2@test.com',
            password: 'password123'
        });
        await user.save();

        const isMatch = await user.comparePassword('password123');
        const isNotMatch = await user.comparePassword('wrongpassword');

        expect(isMatch).toBe(true);
        expect(isNotMatch).toBe(false);
    });
});
