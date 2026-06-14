import { Router } from 'express';
import sql from 'mssql';
import { establishConnection } from '../utils/dbhelper.js';
import dbconfigSetup from '../dbconfigSetup.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();
const config = dbconfigSetup;

router.get('/api/dashboard-stats', 
    authenticateToken, 
    requireRole(["system_admin", "warehouse_manager", "logistics_manager", "inventory_manager"]), 
    async (req, res) => {
    try {
        const pool = await establishConnection(config);

        const result = await pool
            .request()
            .execute("GetDashboardStats");

        const activeOrders = result.recordsets[0][0];
        const alerts = result.recordsets[1][0];
        const inventoryHealth = result.recordsets[2];
        const fleetData = result.recordsets[3][0];
        const uptimeData = result.recordsets[4][0];

        const totalVehicles = fleetData.totalFleet || 1;

        const fleetAvailabilityPct =
            ((fleetData.idleCount / totalVehicles) * 100);

        const totalHubs = uptimeData.totalHubs || 1;

        const uptimePct =
            ((uptimeData.operationalHubs / totalHubs) * 100);

        res.json({
            status: "success",
            data: {
                totalActiveOrders: activeOrders.totalActiveOrders,
                criticalInventoryAlerts: alerts.criticalAlerts,
                fleet: {
                    availabilityPercentage:
                        parseFloat(fleetAvailabilityPct.toFixed(1)),
                    idle: fleetData.idleCount || 0,
                    inTransit: fleetData.inTransitCount || 0
                },
                operationalUptime:
                    parseFloat(uptimePct.toFixed(1)),
                inventoryHealth
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