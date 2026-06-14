import express from 'express';
import dotenv from 'dotenv';
import sql from 'mssql';
import cors from 'cors';
import dbconfigSetup from './dbconfigSetup.js';
import login from './login.js';
import signup from './signup.js';
import firstLoginReset from './firstLoginReset.js';
import fleet from './components/fleet.js';
import inventory from './components/inventory.js';
import warehouses from './components/warehouse.js';
import activities from './components/activities.js';
import forgotPass from './components/forgotPass.js';
import google from './google.js';
import order from './components/order.js';
import logistic from './components/logistic.js';
import user from './components/user.js';
import cookieParser from 'cookie-parser';
import dashboardService from './components/dashboardService.js';
import chat from './components/ai-bot/chat.js';
import cron from 'node-cron';
import { setVehicleIdleAndMatch } from './services/dispatchService.js';

dotenv.config();

const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true              
}));
app.use(express.json());

app.use(cookieParser());

const port = 3000; 

const config = dbconfigSetup;



app.use(login);
app.use(signup);
app.use(firstLoginReset);
app.use(fleet);
app.use(inventory);
app.use(warehouses);
app.use(activities);
app.use(forgotPass);
app.use(google);
app.use(order);
app.use(logistic);
app.use(user);
app.use(dashboardService);
app.use(chat);

// app.get('/api/logistics/dispatch-queue', async (req, res) => {
//     try {
//         let pool = await sql.connect(config);
//         let result = await pool.request().query('SELECT * FROM v_DispatchQueue');
        
//         res.json({
//             status: 'success',
//             data: result.recordset
//         });
//     } catch (err) {
//         res.status(500).json({ status: 'error', message: err.message });
//     }
// });

app.get('/api/logistics/coordinates', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query(`
            SELECT 
                warehouse_id, 
                location_name, 
                total_capacity_sqft, 
                status, 
                latitude, 
                longitude 
            FROM Warehouses
        `);
        
        res.json({
            status: 'success',
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// backend/server.js
// app.post('/api/orders', async (req, res) => {
//     const { productId, quantity, customerName, priority } = req.body;
//     try {
//         let pool = await sql.connect(config);
//         // Executing the Stored Procedure you created in Phase Two
//         let result = await pool.request()
//             .input('ProductID', sql.Int, productId)
//             .input('Qty', sql.Int, quantity)
//             .input('CustomerName', sql.NVarChar, customerName)
//             .input('Priority', sql.Int, priority)
//             .execute('OrderProcessing');
        
//         const outcome = result.recordset[0].Result;
        
//         if (outcome === 'Order Dispatched') {
//             res.json({ status: 'success', message: outcome });
//         } else {
//             res.status(400).json({ status: 'error', message: outcome });
//         }
//     } catch (err) {
//         res.status(500).json({ status: 'error', message: err.message });
//     }
// });

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('SiloKrate_token'); // Destroys the cookie
    res.json({ message: "Logged out successfully" });
});

cron.schedule('* * * * 3', async () => {
    try {
        const pool = await sql.connect(config);
        
        // Checkig if there is at least one 'Packed' order AND an 'Idle' vehicle
        const checkResult = await pool.request().query(`
            IF EXISTS (SELECT 1 FROM Orders WHERE order_status = 'Packed') 
            BEGIN
                SELECT TOP 1 vehicle_id as idle_vehicle_id 
                FROM Fleet 
                WHERE status = 'Idle'
            END
        `);

        if (checkResult.recordset && checkResult.recordset.length > 0) {
            const vehicleToTrigger = checkResult.recordset[0].idle_vehicle_id;
            console.log(`[CRON SWEEP]: Found waiting orders and idle vehicles. Dispatching vehicle ${vehicleToTrigger}...`);
            
            await setVehicleIdleAndMatch(vehicleToTrigger);
        }
    } catch (err) {
        console.error("[CRON SWEEP ERROR]:", err.message);
    }
});

app.listen(port, () => {
    console.log(`Logistics API (ESM) running at http://localhost:${port}`);
});
