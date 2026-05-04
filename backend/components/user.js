import { Router } from "express";
import sql from 'mssql';
import { establishConnection } from '../utils/dbhelper.js'; // Ensure correct path
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
        const pool = await establishConnection(config); // Fixed: Connection Pooling
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const search = req.query.search || "";
        const category = req.query.category || "";

        let whereClause = "WHERE 1=1";
        const createRequest = () => {
            const req = pool.request();
            if (search) req.input("search", sql.VarChar, `%${search}%`);
            if (category && category !== "All Roles") req.input("category", sql.VarChar, category);
            return req;
        };

        if (search) {
            whereClause += " AND (FullName LIKE @search OR Email LIKE @search OR Role LIKE @search)";
        }
        if (category && category !== "All Roles") {
            whereClause += " AND Role = @category";
        }
        
        const dataQuery = `
            SELECT UserId, FullName, Email, Role FROM Users ${whereClause} AND IsDeleted = 0
            ORDER BY UserId OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `;
        const countQuery = `SELECT COUNT(*) as total FROM Users ${whereClause} AND IsDeleted = 0`; // Added count query

        const request = createRequest();
        request.input("offset", sql.Int, offset);
        request.input("limit", sql.Int, limit);

        const [dataResult, countResult] = await Promise.all([
            request.query(dataQuery),
            createRequest().query(countQuery)
        ]);

        const totalItems = countResult.recordset[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // Fixed: Added standardized pagination format
        res.status(200).json({
            status: 200,
            data: dataResult.recordset,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems,
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