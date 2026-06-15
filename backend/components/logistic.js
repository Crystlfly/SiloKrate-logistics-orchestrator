import { Router } from "express";
import sql from "mssql";
import dbconfigSetup from "../dbconfigSetup.js";
import { establishConnection } from '../utils/dbHelper.js'; 
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();
const config = dbconfigSetup;

router.get("/api/logistics", 
    authenticateToken, 
    requireRole(["system_admin", "warehouse_manager", "logistics_manager"]), 
    async (req, res) => {
  try {
    const pool = await establishConnection(config);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const search = req.query.search || "";
    const status = req.query.status || "";
    const vehicle = req.query.vehicle || "";
    const result = await pool.request()
      .input("Search", sql.VarChar, search)
      .input("Status", sql.VarChar, status)
      .input("Vehicle", sql.VarChar, vehicle)
      .input("Offset", sql.Int, offset)
      .input("Limit", sql.Int, limit)
      .execute("GetLogistics");

    const shipments = result.recordset;

    const totalItems =
      shipments.length > 0
        ? shipments[0].totalItems
        : 0;

    const totalPages = Math.ceil(totalItems / limit);

    const data = shipments.map(({ totalItems, ...shipment }) => shipment);

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
    console.error("Logistics Fetch Error:", err.message);
    res.status(500).json({ 
        status: 500, 
        message: "Internal server error: " + err.message 
    });
  }
});

export default router;