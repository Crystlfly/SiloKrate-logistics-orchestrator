import { Router } from "express";
import bcrypt from 'bcryptjs'; 
import sql from 'mssql';
import dbconfigSetup from './dbconfigSetup.js';
import jwt from 'jsonwebtoken';
import { establishConnection } from './utils/dbHelper.js';

const config = dbconfigSetup;
const router = Router();

router.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        let pool = await establishConnection(config);
        
        let result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query("SELECT * FROM Users WHERE Email = @email");

        if (result.recordset.length > 0) {
            const user = result.recordset[0];

            const isMatch = await bcrypt.compare(password, user.PasswordHash);

            if (isMatch) {
            console.log("User requires password change:", user.RequirePasswordChange);
                if (user.RequirePasswordChange === true || user.RequirePasswordChange === 1) {
                    return res.status(200).json({ 
                        success: true,
                        action_required: "password_reset", 
                        userId: user.UserId,
                        message: "First login successful. Password reset required."
                    });
                }

                const token = jwt.sign(
                    { id: user.UserId, name: user.FullName, role: user.Role },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );
                
                res.cookie('SiloKrate_token', token, {
                    httpOnly: true, 
                    secure: process.env.NODE_ENV === 'production', 
                    sameSite: 'lax', 
                    maxAge: 24 * 60 * 60 * 1000 
                });
                
                return res.status(200).json({ 
                    success: true, 
                    message: "Login Successful",
                    userRole: user.Role,
                    expiresAt: Date.now() + (24 * 60 * 60 * 1000)
                });
            } else {
                return res.status(401).json({ success: false, message: "Invalid Credentials" });
            }
        } else {
            return res.status(401).json({ success: false, message: "Invalid Credentials" });
        }
    }
    catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});

export default router;