import { Router } from "express";
import sql from 'mssql';
import bcrypt from 'bcryptjs'; 
import dbconfigSetup from './dbconfigSetup.js';
import {authenticateToken} from './middleware/auth.js';

const config = dbconfigSetup;
const router = Router();

router.post("/api/signup", authenticateToken, async (req, res) => {
    const { fullName, email, role } = req.body;
    try {
        const pool = await sql.connect(config);

        if (req.user.role !== 'system_admin') {
            return res.status(403).json({ message: "Access Denied: Only Admins can add new users." });
        }

        const checkResult = await pool.request()
            .input('email', sql.NVarChar, email)
            .query("SELECT * FROM Users WHERE Email = @email");

        if (checkResult.recordset.length > 0) {
            return res.json({ status: 409, message: "User already exists" });
        }

        const defaultPassword= "Welcome "+ fullName.split(' ')[0] + "123";
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(defaultPassword, salt);

        const insertRes = await pool.request()
            .input('fullname', sql.NVarChar, fullName)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, hashedPassword)
            .input('role', sql.VarChar(50), role)
            .input('requiresPasswordChange', sql.Bit, 1)
            .query(`
                INSERT INTO Users (UserId, FullName, Email, PasswordHash, Role, RequirePasswordChange) 
                VALUES (NEWID(), @fullname, @email, @password, @role, @requiresPasswordChange)
            `);

        if (insertRes.rowsAffected[0] > 0) {
            res.json({ status: 200, message: "User registered successfully" });
        } else {
            res.status(500).json({ message: "Error registering user" });
        }

    } catch (err) {
        console.error("Signup Error:", err.message);
        res.status(500).json({ message: "Error registering user" });
    }
});

export default router;