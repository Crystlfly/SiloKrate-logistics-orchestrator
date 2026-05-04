import {Router} from 'express';
import sql from 'mssql';
import { createOrder } from '../services/orderService.js';
import { updateOrderStatus } from '../services/orderService.js';
import {authenticateToken, requireRole} from '../middleware/auth.js';
import dbconfigSetup from '../dbconfigSetup.js';

const config = dbconfigSetup;
const router = Router();

router.get('/api/orders', 
    authenticateToken, 
    requireRole(["system_admin", "warehouse_manager", "logistics_manager", "inventory_manager", "warehouse_staff", "inventory_staff"]), 
    async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const page= parseInt(req.query.page) || 1;
        const limit= parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const search = req.query.search || "";
        const status = req.query.status || "";
        const priority = req.query.priority || "";
        let whereClause = "WHERE 1=1";
        const createRequest = () => {
            const req = pool.request();
            if (search) req.input("search", sql.VarChar, `%${search}%`);
            if (status) req.input("status", sql.VarChar, status);
            if (priority) req.input("priority", sql.Int, parseInt(priority));

            req.input("offset", sql.Int, offset);
            req.input("limit", sql.Int, limit);
            
            return req;
        };

        if (search) {
            whereClause += " AND (CAST(order_id AS VARCHAR(255)) LIKE @search OR CAST(product_id AS VARCHAR(255)) LIKE @search OR CAST(destination_address AS VARCHAR(255)) LIKE @search) OR customer_name LIKE @search ";
        }
        if (status) {
            whereClause += " AND order_status = @status";
        }
        if (priority) {
            whereClause += " AND priority_level = @priority";
        }

        const dataQuery = await createRequest().query(`SELECT * FROM AllOrdersDetails
            ${whereClause} 
            ORDER BY order_id DESC 
            OFFSET @offset ROWS 
            FETCH NEXT @limit ROWS ONLY`);
        const countQuery = await createRequest().query(`SELECT COUNT(*) as total FROM AllOrdersDetails ${whereClause}`);

        const totalItems = countQuery.recordset[0].total;
        const totalPages = Math.ceil(totalItems / limit);
        
        res.status(200).json({
            status: 200, 
            data: dataQuery.recordset,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages
            }
        });

    } catch(err) {
        console.error("Orders Fetch Error:", err.message);
        
        res.status(500).json({
            status: 500, 
            message: "Failed to fetch orders from the database.",
            error: err.message
        });
    }
});

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
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message
        });
    }
});

export default router;
