import jwt from 'jsonwebtoken';
import { Router } from 'express';
import sql from 'mssql';
import dbconfigSetup from './dbconfigSetup.js';

const router = Router();
const config = dbconfigSetup;

router.post("/api/google", async (req, res) => {
    const { token } = req.body;

    try {
        // 1. Verify token by calling Google's UserInfo API using native fetch
        const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Fetch does not throw on 4xx/5xx errors, so we check manually
        if (!googleRes.ok) {
            throw new Error(`Google API error: ${googleRes.statusText}`);
        }

        const data = await googleRes.json();
        const { sub: googleId, email, name, picture } = data;

        const pool = await sql.connect(config);

        // 2. Check if user already exists
        const userCheck = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');

        let userId;

        if (userCheck.recordset.length > 0) {
            // User exists - Get their ID
            userId = userCheck.recordset[0].UserId;
            
            // Optional: Update GoogleId if it's missing (linking accounts)
            if (!userCheck.recordset[0].GoogleId) {
                 await pool.request()
                    .input('googleId', sql.VarChar, googleId)
                    .input('email', sql.VarChar, email)
                    .query('UPDATE Users SET GoogleId = @googleId WHERE Email = @email');
            }
        } else {
            // 3. Create new user
            const insertRes = await pool.request()
                .input('name', sql.VarChar, name)
                .input('email', sql.VarChar, email)
                .input('googleId', sql.VarChar, googleId)
                .input('picture', sql.VarChar, picture)
                .query(`
                    INSERT INTO Users (UserId, FullName, Email, GoogleId, RoleId) 
                    OUTPUT INSERTED.UserId
                    VALUES (NEWID(), @name, @email, @googleId, 2)
                `);
            userId = insertRes.recordset[0].UserId;
        }

        // 4. Generate JWT for your app
        const SiloKrateToken = jwt.sign(
            { id: userId, email: email, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ success: true, token: SiloKrateToken });

    } catch (err) {
        console.error("Google Auth Error:", err);
        res.status(500).json({ error: "Authentication failed" });
    }
});
export default router;