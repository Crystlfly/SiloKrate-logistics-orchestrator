import {Router} from 'express';
import sql from 'mssql';
import dbconfigSetup from '../dbconfigSetup.js';
import { sendForgotPasswordEmail } from '../services/sendForgotPasswordEmail.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs'; 
const router=Router();
const config = dbconfigSetup;

router.post("/api/forgot-password", async(req,res)=>{
    const {email} = req.body;
    try{
        const pool=await sql.connect(config);
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query(`SELECT UserId FROM Users WHERE email = @email`);
        if(result.recordset.length === 0){
            return res.status(404).json({error:"User not found"});
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const tokenExpiry = new Date(Date.now() + 3600000);
        const uid = result.recordset[0].UserId;
        await pool.request()
            .input('resetToken', sql.VarChar, hashedToken)
            .input('tokenExpiry', sql.DateTime, tokenExpiry)
            .input('UserId', sql.VarChar, uid)
            .query(`UPDATE Users SET ResetToken = @resetToken, ResetTokenExpiry = @tokenExpiry WHERE UserId = @UserId`);
        await sendForgotPasswordEmail(email, resetToken);
        res.json({status:200, message:"Password reset email sent"});
    }catch(err){
        console.error("Error in forgot password process:", err);
        res.status(500).json({error:"Internal Server Error"});  
    }
});

router.post("/api/reset-password", async(req,res)=>{
    const {token, newPassword} = req.body;
    try{
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('resetToken', sql.VarChar, hashedToken)
            .query(`SELECT UserId FROM Users WHERE ResetToken = @resetToken AND ResetTokenExpiry > GETDATE()`);
        if(result.recordset.length === 0){
            return res.status(400).json({error:"Invalid or expired token"});
        }
        const uid = result.recordset[0].UserId;
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.request()
            .input('newPassword', sql.VarChar, hashedPassword)
            .input('UserId', sql.VarChar, uid)
            .query(`UPDATE Users SET PasswordHash = @newPassword WHERE UserId = @UserId`);
        await pool.request()
            .input('UserId', sql.VarChar, uid)
            .query(`UPDATE Users SET ResetToken = NULL, ResetTokenExpiry = NULL WHERE UserId = @UserId`);
        res.json({status:200, message:"Password reset successfully"});
    }catch(err){
        console.error("Error in reset password process:", err);
        res.status(500).json({error:"Internal Server Error"});  
    }
});

export default router;  