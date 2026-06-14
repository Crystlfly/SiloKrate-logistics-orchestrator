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
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const search = req.query.search || "";
        const category = req.query.category || "";
        const status = req.query.status || "";

        const result = await pool.request()
                .input("Search", sql.VarChar, search)
                .input("Category", sql.VarChar, category)
                .input("Status", sql.VarChar, status)
                .input("Offset", sql.Int, offset)
                .input("Limit", sql.Int, limit)
                .execute("GetInventory");

        const products = result.recordsets[0];

        const stats = result.recordsets[1][0];

        const totalItems =
            products.length > 0
                ? products[0].totalItems
                : 0;

        const totalPages = Math.ceil(totalItems / limit);
        const data = products.map(({ totalItems, ...product }) => product);

        res.json({
            status: 200,
            data,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                itemsPerPage: limit
            },
            stats: {
                total: stats.total,
                low: stats.low,
                over: stats.over,
                out: stats.out
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