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

        const result = await pool.request()
            .input("Search", sql.VarChar, search)
            .input("Type", sql.VarChar, type)
            .input("Status", sql.VarChar, status)
            .input("Offset", sql.Int, offset)
            .input("Limit", sql.Int, limit)
            .execute("GetFleet");

        const fleet = result.recordsets[0];
        const stats = result.recordsets[1][0];

        const totalItems =
            fleet.length > 0
                ? fleet[0].totalItems
                : 0;

        const totalPages = Math.ceil(totalItems / limit);

        const data = fleet.map(({ totalItems, ...vehicle }) => vehicle);

        res.json({
            status: 200,
            data,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                itemsPerPage: limit
            },
            stats
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
        
        if (err.message.includes("does not exist")) {
            res.status(400).json({ 
                status: 400, 
                message: err.message 
            });
        } else {
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