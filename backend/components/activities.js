import {Router} from 'express';
import sql from 'mssql';
import dbconfigSetup from '../dbconfigSetup.js';
import {addFleet, updateFleet, deleteFleet} from '../services/vehicleService.js';
import {authenticateToken, requireRole} from '../middleware/auth.js';


const config = dbconfigSetup;
const router = Router();

router.get('/api/activities', authenticateToken, 
    requireRole(["system_admin", "warehouse_manager", "logistics_manager", "inventory_manager", "warehouse_staff", "inventory_staff"]),
    async (req, res) => {
    try {
        const pool = await sql.connect(config);
        
        const query = `
            SELECT TOP 15
                a.activity_type, 
                a.reference_code, 
                a.quantity, 
                a.status, 
                a.created_at,
                w.location_name as location
            FROM warehouse_activities a
            LEFT JOIN warehouses w 
                ON a.warehouse_id = w.warehouse_id
            ORDER BY a.created_at DESC
        `;
        
        const result = await pool.request().query(query); 
        
        res.status(200).json({ data: result.recordset });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
});
export default router;