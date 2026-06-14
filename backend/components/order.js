import {Router} from 'express';
import sql from 'mssql';
import { createOrder } from '../services/orderService.js';
import { updateOrderStatus } from '../services/orderService.js';
import {authenticateToken, requireRole} from '../middleware/auth.js';
import dbconfigSetup from '../dbconfigSetup.js';
import { packOrderAndDispatch, setVehicleIdleAndMatch } from '../services/dispatchService.js'; 

const config = dbconfigSetup;
const router = Router();

router.get(
  '/api/orders', authenticateToken, 
  requireRole(["system_admin", "warehouse_manager", "logistics_manager", "inventory_manager", "warehouse_staff", "inventory_staff"]), async (req, res) => {
    try {
      const pool = await sql.connect(config);

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const search = req.query.search || "";
      const status = req.query.status || "";
      const priority = req.query.priority
        ? parseInt(req.query.priority)
        : null;

      const result = await pool
        .request()
        .input("Search", sql.VarChar, search)
        .input("Status", sql.VarChar, status)
        .input("Priority", sql.Int, priority)
        .input("Offset", sql.Int, offset)
        .input("Limit", sql.Int, limit)
        .execute("GetOrders");

      const orders = result.recordsets[0];
      const totalItems = result.recordsets[1][0].total;

      res.status(200).json({
        status: 200,
        data: orders,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages: Math.ceil(totalItems / limit)
        }
      });

    } catch (err) {
      console.error("Orders Fetch Error:", err.message);

      res.status(500).json({
        status: 500,
        message: "Failed to fetch orders from the database.",
        error: err.message
      });
    }
  }
);

router.post('/api/orders', 
    authenticateToken, 
    requireRole(["system_admin", "warehouse_manager"]), 
    async (req, res) => {
    // console.log('User object from middleware:', req.user);
    const username = req.user.name;
    const orderData=req.body;
    try{
        const result = await createOrder(orderData, username);
        
        res.status(201).json({
            status: 201, 
            message: result.message, 
            orderId: result.orderId
        });
    }catch(err){
        const statusCode = err.message.includes('stock') ? 400 : 500;
        res.status(statusCode).json({
            status: statusCode, 
            message: err.message
        });
    }
});

router.patch('/api/orders/:id/status', 
    authenticateToken, 
    requireRole(["system_admin", "warehouse_manager", "logistics_manager", "warehouse_staff"]), 
    async (req, res) => {
    const orderId = parseInt(req.params.id);
    const { newStatus } = req.body;

    try {
        await updateOrderStatus(orderId, newStatus);
        res.status(200).json({
            status: 200,
            message: "Order status updated successfully."
        });
        console.log(`Order ${orderId} status updated to ${newStatus}`);
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message
        });
    }
});

router.post('/api/orders/:id/pack', 
    authenticateToken, 
    requireRole(["system_admin", "warehouse_manager", "warehouse_staff"]), 
    async (req, res) => {
    
    const orderId = parseInt(req.params.id);
    
    try {
        const result = await packOrderAndDispatch(orderId);
        res.status(result.status).json({
            status: result.status,
            message: result.message,
            vehicleId: result.vehicleId || null
        });
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message
        });
    }
});

router.post('/api/fleet/:id/idle', 
    authenticateToken, 
    // Assuming you have a driver or logistics role for fleet management
    requireRole(["system_admin", "logistics_manager", "driver"]), 
    async (req, res) => {
    
    const vehicleId = parseInt(req.params.id);

    try {
        const result = await setVehicleIdleAndMatch(vehicleId);
        res.status(result.status).json({
            status: result.status,
            message: result.message,
            orderId: result.orderId || null
        });
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message
        });
    }
});

export default router;
