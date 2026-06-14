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
        const pool = await establishConnection(config); 
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const search = req.query.search || "";
        const type = req.query.type || "";
        const result = await pool.request()
                .input("Search", sql.VarChar, search)
                .input("Type", sql.VarChar, type)
                .input("Offset", sql.Int, offset)
                .input("Limit", sql.Int, limit)
                .execute("GetWarehouses");

        const warehouses = result.recordset;

        const totalItems =
                warehouses.length > 0
                    ? warehouses[0].totalItems
                    : 0;

        const totalPages = Math.ceil(totalItems / limit);

        res.json({
                status: 200,
                data: warehouses,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems,
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
        const pool = await establishConnection(config); 

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20; // Changed limit from 200 to 20 for standard pagination
        const offset = (page - 1) * limit;

        const search = req.query.search || "";
        const type = req.query.type || "";
        const result = await pool.request()
            .input("Search", sql.VarChar, search)
            .input("Type", sql.VarChar, type)
            .input("Offset", sql.Int, offset)
            .input("Limit", sql.Int, limit)
            .execute("GetZones");

        const zones = result.recordset;

        const totalItems =
            zones.length > 0
                ? zones[0].totalItems
                : 0;

        const totalPages = Math.ceil(totalItems / limit);

        const data = zones.map(({ totalItems, ...zone }) => zone);

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
    requireRole(["system_admin"]), 
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