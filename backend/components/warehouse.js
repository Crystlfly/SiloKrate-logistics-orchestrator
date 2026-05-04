import { Router } from 'express';
import sql from 'mssql';
import { establishConnection } from '../utils/dbhelper.js'; // Ensure correct path
import dbconfigSetup from '../dbconfigSetup.js';
import { addWarehouse, updateWarehouse, deleteWarehouse } from '../services/warehouseService.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();
const config = dbconfigSetup;

router.get("/api/warehouses",
    authenticateToken, 
    requireRole(["system_admin", "warehouse_manager", "logistics_manager", "inventory_manager", "warehouse_staff", "inventory_staff"]),
    async(req, res) => {
    try {
        const pool = await establishConnection(config); // Fixed
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const search = req.query.search || "";
        const type = req.query.type || "";
        let whereClause = "WHERE 1=1";
        const createRequest = () => {
            const req = pool.request();
            if (search) req.input("search", sql.VarChar, `%${search}%`);
            if (type && type !== "All Types") req.input("type", sql.VarChar, type);
            return req;
        }

        if (search) {
            whereClause += " AND (location_name LIKE @search OR warehouse_type LIKE @search OR warehouse_id LIKE @search)";
        }

        if (type && type !== "All Types") {
            whereClause += " AND warehouse_type = @type";
        }

        const dataQuery = `SELECT * FROM Warehouses ${whereClause} AND IsDeleted = 0 ORDER BY warehouse_id OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
        const countQuery = `SELECT COUNT(*) as total FROM Warehouses ${whereClause} AND IsDeleted = 0`;

        const [dataResult, countResult] = await Promise.all([
            createRequest().query(dataQuery),
            createRequest().query(countQuery)
        ]);

        const totalItems = countResult.recordset[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        res.json({
            status: 200,
            data: dataResult.recordset,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems,
                itemsPerPage: limit
            },
            stats: {}
        });

    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/api/zones", 
    authenticateToken, 
    requireRole(["system_admin", "warehouse_manager", "logistics_manager", "inventory_manager", "warehouse_staff", "inventory_staff"]), 
    async(req, res) => {
    try {
        const pool = await establishConnection(config); // Fixed

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20; // Changed limit from 200 to 20 for standard pagination
        const offset = (page - 1) * limit;

        const search = req.query.search || "";
        const type = req.query.type || "";
        let whereClause = "WHERE 1=1";

        const createRequest = () => {
            const req = pool.request();
            if (search) req.input("search", sql.VarChar, `%${search}%`);
            if (type && type !== "All Types") req.input("type", sql.VarChar, type);
            return req;
        }

        if (search) {
           whereClause += " AND (z.zone_type LIKE @search OR z.zone_name LIKE @search OR w.location_name LIKE @search)";
        }

        if (type && type !== "All Types") {
            whereClause += " AND z.zone_type = @type";
        }

        const dataQuery = `
            SELECT z.*, w.location_name as warehouse_name
            FROM Zones z
            LEFT JOIN Warehouses w ON z.warehouse_id = w.warehouse_id
            ${whereClause} AND z.IsDeleted = 0 
            ORDER BY z.zone_id 
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `;
        const countQuery = `
             SELECT COUNT(*) as total
             FROM Zones z
             LEFT JOIN Warehouses w ON z.warehouse_id = w.warehouse_id
             ${whereClause} AND z.IsDeleted = 0 
        `; // Added count query

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
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post('/api/addWarehouse', 
    authenticateToken, 
    requireRole(["system_admin", "warehouse_manager"]), 
    async (req, res) => {
    try {
        const warehouseData = req.body;
        const result = await addWarehouse(warehouseData, req.user?.name);
        res.json({status: 201, message: result.message, warehouseId: result.warehouseId});
    } catch(err) {
        console.error("Add Warehouse Error:", err.message);
        res.status(500).json({ status: 500, message: "Internal server error: " + err.message }); // Fixed
    }
});

router.put('/api/updateWarehouse/:id', 
    authenticateToken, 
    requireRole(["system_admin", "warehouse_manager"]), 
    async (req, res) => {
    try {
        const warehouseId = parseInt(req.params.id, 10);
        const warehouseData = req.body;
        await updateWarehouse(warehouseId, warehouseData);
        res.json({ status: 200, message: "Warehouse updated successfully" });
    } catch (err) {
        console.error("Error updating warehouse:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.delete('/api/deleteWarehouse/:id', 
    authenticateToken, 
    requireRole(["system_admin"]), // Fixed: Only admins can delete buildings
    async (req, res) => {
    try {
        const warehouseId = parseInt(req.params.id, 10);
        await deleteWarehouse(warehouseId);
        res.json({ status: 200, message: "Warehouse deleted successfully" });
    } catch (err) {
        console.error("Error deleting warehouse:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
export default router;