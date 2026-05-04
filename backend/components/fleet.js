import {Router} from 'express';
import sql from 'mssql';
import dbconfigSetup from '../dbconfigSetup.js';
import {addFleet, updateFleet, deleteFleet} from '../services/vehicleService.js';
import {authenticateToken, requireRole} from '../middleware/auth.js';

const config = dbconfigSetup;
const router = Router();

router.get('/api/fleet', 
    authenticateToken, 
    requireRole(["system_admin", "warehouse_manager", "logistics_manager"]), 
    async (req, res) => {
    try{
        const pool= await sql.connect(config);

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const search = req.query.search || "";
        const type= req.query.type || "";
        const status = req.query.status || "";

        let whereClause = "WHERE 1=1";
        const request = pool.request();

        const params = {
            search: { type: sql.VarChar, value: `%${search}%` },
            type: { type: sql.VarChar, value: type },
            status: { type: sql.VarChar, value: status },
            offset: { type: sql.Int, value: offset },
            limit: { type: sql.Int, value: limit }
        };

        if (search) {
            whereClause += " AND (vehicle_id LIKE @search OR driver_name LIKE @search OR current_route LIKE @search)";
            request.input("search", sql.VarChar, `%${search}%`);
        }

        if (type && type !== "All Types") {
            whereClause += " AND vehicle_type LIKE @type";
            request.input("type", sql.VarChar, `%${type}%`);
        }

        if (status && status !== "All Statuses") {
            whereClause += " AND f.status = @status";
            request.input("status", sql.VarChar, status);
        }
                
        const dataQuery= `
            SELECT 
                f.*, 
                w.location_name AS warehouse_location 
            FROM Fleet f 
            LEFT JOIN Warehouses w ON f.current_warehouse_id = w.warehouse_id
            ${whereClause} AND f.IsDeleted = 0
            ORDER BY vehicle_id DESC 
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `;

        const countQuery = `SELECT COUNT(*) as total FROM Fleet f ${whereClause} AND f.IsDeleted = 0`;

        const statsQuery = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) as low,
                SUM(CASE WHEN status = 'In-Transit' THEN 1 ELSE 0 END) as [over],
                SUM(CASE WHEN status = 'Idle' THEN 1 ELSE 0 END) as [out]
            FROM Fleet
            WHERE IsDeleted = 0
        `;

        const createRequest = () => {
            const req = pool.request();
            if (search) req.input("search", params.search.type, params.search.value);
            if (type && type !== "All Types") req.input("type", params.type.type, params.type.value);
            if (status && status !== "All Statuses") req.input("status", params.status.type, params.status.value);
            return req;
        };

        const [dataResult, countResult, statsResult] = await Promise.all([
            createRequest()
                .input("offset", params.offset.type, params.offset.value)
                .input("limit", params.limit.type, params.limit.value)
                .query(dataQuery), 
            
            createRequest().query(countQuery),
            
            pool.request().query(statsQuery)
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
            stats: statsResult.recordset[0]
        });
    }
    catch(err){
        console.error("Fleet Fetch Error:", err.message);
        res.status(500).json({status:500, message:"Internal server error: " + err.message});
    }
});

router.post('/api/addFleet', 
    authenticateToken, 
    requireRole(["system_admin", "logistics_manager"]), 
    async (req, res) => {
    try{
        const fleetData=req.body;
        const result = await addFleet(fleetData, req.user?.name);
        res.json({status:201, message: result.message, vehicleId: result.vehicleId});
    }catch (err) {
        console.error("Add Fleet Error:", err.message);
        
        // Check if it's our custom "Warehouse does not exist" error
        if (err.message.includes("does not exist")) {
            // Send 400 Bad Request for validation errors
            res.status(400).json({ 
                status: 400, 
                message: err.message 
            });
        } else {
            // Send 500 for other server errors
            res.status(500).json({ 
                status: 500, 
                message: "Internal server error: " + err.message 
            });
        }
    }
});

router.put('/api/updateFleet/:id', 
    authenticateToken, 
    requireRole(["system_admin", "logistics_manager"]), 
    async (req, res) => {
    try {
        const vehicleId = parseInt(req.params.id, 10);
        const fleetData = req.body;
        await updateFleet(vehicleId, fleetData);
        res.json({ status: 200, message: "Fleet updated successfully" });
    } catch (err) {
        console.error("Error updating fleet:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.delete('/api/deleteFleet/:id', 
    authenticateToken, 
    requireRole(["system_admin", "logistics_manager"]), 
    async (req, res) => {
    try {
        const vehicleId = parseInt(req.params.id, 10);
        await deleteFleet(vehicleId);
        res.json({ status: 200, message: "Fleet deleted successfully" });
    } catch (err) {
        console.error("Error deleting fleet:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;