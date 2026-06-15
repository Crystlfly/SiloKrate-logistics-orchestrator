import { Router } from "express";
import bcrypt from 'bcryptjs'; 
import sql from 'mssql';
import dbconfigSetup from './dbconfigSetup.js';
import { establishConnection } from './utils/dbHelper.js';

const config = dbconfigSetup;
const router = Router();

router.post('/api/auth/first-login-reset', async (req, res) => {
    const { userId, newPassword } = req.body;

    try {
        const pool = await establishConnection(config);

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        const request = pool.request();
        request.input("UserId", sql.UniqueIdentifier, userId); 
        request.input("NewPassword", sql.NVarChar, hashedNewPassword);

        await request.query(`
            UPDATE Users 
            SET PasswordHash = @NewPassword, RequirePasswordChange = 0 
            WHERE UserId = @UserId
        `);

        return res.status(200).json({ success: true, message: "Password updated successfully." });
        
    } catch (err) {
        console.error("Password Reset Error:", err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

export default router;