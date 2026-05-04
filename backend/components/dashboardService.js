import { Router } from 'express';
import sql from 'mssql';
import { establishConnection } from '../utils/dbhelper.js';
import dbconfigSetup from '../dbconfigSetup.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();
const config = dbconfigSetup;

// Added authenticateToken to protect the route!
// Note: If you mount this in server.js using app.use('/api', router), change this string to just '/dashboard-stats'
router.get('/api/dashboard-stats', 
    authenticateToken, 
    requireRole(["system_admin", "warehouse_manager", "logistics_manager", "inventory_manager"]), 
    async (req, res) => {
    try {
        const pool = await establishConnection(config);
        
        const stats = await pool.request().query(`
            -- 1. Get Active Orders
            SELECT COUNT(*) as totalActiveOrders FROM Orders WHERE order_status NOT IN ('Completed', 'Delivered');
            
            -- 2. Get Critical Alerts Count
            SELECT COUNT(*) as criticalAlerts FROM Products WHERE current_stock <= reorder_level AND IsDeleted = 0;
            
            -- 3. Get Inventory Health
            SELECT TOP 5 name, current_stock, reorder_level, warehouse_id 
            FROM Products 
            WHERE IsDeleted = 0 
            ORDER BY CASE WHEN current_stock <= reorder_level THEN 0 ELSE 1 END, current_stock ASC;

            -- 4. Fleet Availability (Required for your React UI)
            SELECT 
                COUNT(vehicle_id) as totalFleet,
                SUM(CASE WHEN status = 'Idle' THEN 1 ELSE 0 END) as idleCount,
                SUM(CASE WHEN status = 'In Transit' THEN 1 ELSE 0 END) as inTransitCount,
                SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) as maintenanceCount
            FROM Fleet 
            WHERE IsDeleted = 0;

            -- 5. Operational Uptime (Warehouse Availability)
            -- Assuming you add a 'status' VARCHAR column to your Warehouses table
            SELECT 
                COUNT(warehouse_id) as totalHubs,
                SUM(CASE WHEN status = 'Operational' THEN 1 ELSE 0 END) as operationalHubs
            FROM Warehouses 
            WHERE IsDeleted = 0;
        `);

        const fleetData = stats.recordsets[3][0];
        const totalVehicles = fleetData.totalFleet || 1;
        const fleetAvailabilityPct = ((fleetData.idleCount / totalVehicles) * 100).toFixed(1);

        // Uptime math
        const uptimeData = stats.recordsets[4][0];
        const totalHubs = uptimeData.totalHubs || 1; // Prevent division by zero
        const operationalHubs = uptimeData.operationalHubs || 0;
        const uptimePct = ((operationalHubs / totalHubs) * 100).toFixed(1);

        res.json({
            status: "success",
            data: {
                totalActiveOrders: stats.recordsets[0][0].totalActiveOrders,
                criticalInventoryAlerts: stats.recordsets[1][0].criticalAlerts,
                fleet: {
                    availabilityPercentage: parseFloat(fleetAvailabilityPct),
                    idle: fleetData.idleCount || 0,
                    inTransit: fleetData.inTransitCount || 0
                },
                operationalUptime: parseFloat(uptimePct),
                inventoryHealth: stats.recordsets[2]
            }
        });

    } catch (err) {
        console.error("Dashboard Sync Error:", err.message);
        res.status(500).json({ 
            status: "error", 
            message: "Failed to fetch dashboard statistics" 
        });
    }
});

export default router;