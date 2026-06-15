import { Router } from "express";
import sql from 'mssql';
import { establishConnection } from '../utils/dbHelper.js'; // Ensure correct path
import dbconfigSetup from '../dbconfigSetup.js';
import { updateUser, deleteUser } from "../services/userService.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = Router();
const config = dbconfigSetup;

router.get("/api/users", 
    authenticateToken, 
    requireRole(["system_admin"]), 
    async (req, res) => {
    try {
        const pool = await establishConnection(config); 
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const search = req.query.search || "";
        const category = req.query.category || "";

        const result = await pool.request()
            .input("Search", sql.VarChar, search)
            .input("Category", sql.VarChar, category)
            .input("Offset", sql.Int, offset)
            .input("Limit", sql.Int, limit)
            .execute("GetUsers");

        const users = result.recordset;

        const totalItems =
            users.length > 0
                ? users[0].totalItems
                : 0;

        const totalPages = Math.ceil(totalItems / limit);
        const data = users.map(({ totalItems, ...user }) => user);

        res.status(200).json({
            status: 200,
            data,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                itemsPerPage: limit
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.put('/api/updateUser/:id', 
    authenticateToken, 
    requireRole(["system_admin"]), 
    async (req, res) => {
    const userId = req.params.id;
    const userData = req.body;
    try {
        await updateUser(userId, userData);
        res.json({ status: 200, message: "User updated successfully" });
    } catch (err) {
        console.error("Update User Error:", err.message);
        res.status(500).json({ error: "Internal server error: " + err.message });
    }
});

router.delete('/api/deleteUser/:id', 
    authenticateToken, 
    requireRole(["system_admin"]), 
    async (req, res) => {
    const userId = req.params.id;
    try {
        if (req.user.id == userId){
            return res.status(403).json({ message: "Access Denied. You cannot delete your own account." });
        }
        console.log("Deleting user with ID:", userId);
        console.log("Request made by user:", req.user.id);
        await deleteUser(userId);
        res.json({ status: 200, message: "User deleted successfully" });
    } catch (err) {
        console.error("Delete User Error:", err.message);
        res.status(500).json({ error: "Internal server error: " + err.message });
    }
});

export default router;