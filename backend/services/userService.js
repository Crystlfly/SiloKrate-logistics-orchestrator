import sql from 'mssql';
import { establishConnection } from '../utils/dbHelper.js';
import dbconfigSetup from '../dbconfigSetup.js';

const config = dbconfigSetup;

export async function updateUser(userId, userData) {
    try {
        const pool = await establishConnection(config);
        const { fullName, email, role } = userData;
        await pool.request()
            .input('id', sql.UniqueIdentifier, userId)
            .input('fullName', sql.VarChar, fullName)
            .input('email', sql.VarChar, email)
            .input('role', sql.VarChar(50), role)
            .query(`
                UPDATE Users SET FullName = @fullName, Email = @email, Role = @role WHERE UserId = @id
            `);
    }   catch (err) {
        throw err;
    }   
};

export async function deleteUser(userId) {
    try{
        const pool = await establishConnection(config);
        const count = await pool.request()
            .input('id', sql.UniqueIdentifier, userId)
            .query(`
                SELECT COUNT(*) as count FROM Users WHERE UserId = @id AND IsDeleted = 0
            `);
        if (count.recordset[0].count === 0) {
            throw new Error("User not found or already deleted");
        }
        await pool.request()
            .input('id', sql.UniqueIdentifier, userId)
            .query(`
                UPDATE Users SET IsDeleted = 1 WHERE UserId = @id
            `);
    }catch(err){
        throw err;
    }
};