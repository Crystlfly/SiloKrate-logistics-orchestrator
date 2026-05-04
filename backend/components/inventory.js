import sql from 'mssql';
import dbconfigSetup from '../dbconfigSetup.js';
import {Router} from 'express';
import {addProduct, updateProduct, deleteProduct} from '../services/productService.js';
import {authenticateToken, requireRole} from '../middleware/auth.js';

const router=Router();
const config = dbconfigSetup;

router.get("/api/inventory", 
    authenticateToken, 
    requireRole(["system_admin", "warehouse_manager", "warehouse_staff", "inventory_manager", "inventory_staff"]), 
    async (req, res) => {
    try {
        const pool = await sql.connect(config);
        
        // 1. Extract Query Parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const search = req.query.search || "";
        const category = req.query.category || "";
        const status = req.query.status || "";

        // 2. Build the Dynamic WHERE Clause
        let whereClause = "WHERE 1=1";
        const request = pool.request(); 

        if (search) {
            whereClause += " AND (sku LIKE @search OR name LIKE @search OR category LIKE @search)";
            request.input("search", sql.VarChar, `%${search}%`);
        }

        if (category && category !== "All Categories") {
            whereClause += " AND category = @category";
            request.input("category", sql.VarChar, category);
        }

        if (status && status !== "All Statuses") {
            whereClause += " AND status = @status";
            request.input("status", sql.VarChar, status);
        }

        // 3. RUN THREE QUERIES 
        
        // Query A: Get the actual 10 rows for the table
        const dataQuery = `
            SELECT * FROM Products 
            ${whereClause} AND IsDeleted = 0
            ORDER BY product_id DESC -- Order is REQUIRED for pagination
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `;
        
        // Query B: Get total count matching filters (for "Page 1 of X")
        const countQuery = `SELECT COUNT(*) as total FROM Products ${whereClause} AND IsDeleted = 0`; // Assuming you have a soft delete mechanism

        // Query C: Get global stats (For the cards at the top)
        const statsQuery = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Low Stock' THEN 1 ELSE 0 END) as low,
                SUM(CASE WHEN status = 'In-Stock' THEN 1 ELSE 0 END) as [over], -- Fixed: Added brackets
                SUM(CASE WHEN status = 'Out of Stock' THEN 1 ELSE 0 END) as [out] -- Fixed: Added brackets
            FROM Products
            WHERE IsDeleted = 0
        `;

        request.input("offset", sql.Int, offset);
        request.input("limit", sql.Int, limit);

        const [dataResult, countResult, statsResult] = await Promise.all([
            request.query(dataQuery),
            pool.request().input("search", sql.VarChar, `%${search}%`) // Re-bind for independent queries if needed, or reuse object carefully
                .input("category", sql.VarChar, category)
                .input("status", sql.VarChar, status)
                .query(countQuery),
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
            stats: {
                total: statsResult.recordset[0].total,
                low: statsResult.recordset[0].low,
                over: statsResult.recordset[0].over,
                out: statsResult.recordset[0].out
            }
        });

    } catch (err) {
        console.error("Error fetching inventory:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post('/api/addProduct', 
    authenticateToken, 
    requireRole(["system_admin", "inventory_manager"]), 
    async (req, res) => {
    try{
        const productData=req.body;
        const result = await addProduct(productData, req.user?.name);
        res.json({status:201, message: result.message, productId: result.productId});
    }catch(err){
        console.error("Error adding product:", err);
        res.status(500).json({error:"Internal Server Error"});
    }
});

router.put('/api/updateProduct/:id', 
    authenticateToken, 
    requireRole(["system_admin", "warehouse_manager", "inventory_manager", "inventory_staff"]), 
    async (req, res) => {
    try {
        const productId = parseInt(req.params.id, 10);
        const productData = req.body;
        await updateProduct(productId, productData);
        res.json({ status: 200, message: "Product updated successfully" });
    } catch (err) {
        console.error("Error updating product:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.delete('/api/deleteProduct/:id', 
    authenticateToken, 
    requireRole(["system_admin", "inventory_manager"]), 
    async (req, res) => {
    try {
        const productId = parseInt(req.params.id, 10);
        await deleteProduct(productId);
        res.json({ status: 200, message: "Product deleted successfully" });
    } catch (err) {
        console.error("Error deleting product:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;