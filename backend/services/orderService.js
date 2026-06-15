import { establishConnection } from '../utils/dbHelper.js';
import dbconfigSetup from '../dbconfigSetup.js';
import sql from 'mssql';

const config = dbconfigSetup;

export async function createOrder(orderData, authenticatedUsername) {
    if (!authenticatedUsername) {
        throw new Error("Cannot create order: User is not authenticated.");
    }
    const { itemid, quantity, date, priorityLvl, dest } = orderData;
    
    const pool = await establishConnection(config);
    const transaction = new sql.Transaction(pool);
    const priorityMap = { 'Low':1, 'Normal': 2, 'High': 3 };
    const priorityValue = priorityMap[priorityLvl] || 1;
    
    // Flag to track if transaction is active
    let transactionStarted = false;

    try {
        await transaction.begin();
        transactionStarted = true;

        const request = new sql.Request(transaction);

        // 1. Current stock and warehouse_id fetch
        let cData = await request
            .input('itemid', sql.Int, itemid)
            .query('SELECT current_stock, warehouse_id, zone_id, per_volume FROM Products WHERE product_id = @itemid AND IsDeleted=0');
            
        cData = cData.recordset[0];
        const stock = cData?.current_stock;
        
        if (stock === undefined) throw new Error("Product not found.");
        if (stock < quantity) throw new Error(`Insufficient stock. Only ${stock} available.`);

        // 2. DEDUCT STOCK
        const stockUpdateResult = new sql.Request(transaction);
        await stockUpdateResult
            .input('qty_deduct', sql.Int, quantity)
            .input('itemid_deduct', sql.Int, itemid)
            .query('UPDATE Products SET current_stock = current_stock - @qty_deduct WHERE product_id = @itemid_deduct');
        
        // 3. Reduce the occupied capacity in the zone and warehouse
        const reqWhUpdate = new sql.Request(transaction);
        await reqWhUpdate
            .input('warehouseId', sql.Int, cData.warehouse_id)
            .input('orderedVolume', sql.Int, cData.per_volume * quantity)
            .query(`UPDATE warehouses SET used_capacity_sqft = used_capacity_sqft - @orderedVolume WHERE warehouse_id = @warehouseId`);

        const reqZoneUpdate = new sql.Request(transaction);
        await reqZoneUpdate
            .input('zoneId', sql.Int, cData.zone_id)
            .input('orderedVolumeZone', sql.Int, cData.per_volume * quantity)
            .query(`UPDATE zones SET current_occupancy = current_occupancy - @orderedVolumeZone WHERE zone_id = @zoneId`);
        
        // 4. CREATE ORDER (With OUTPUT inserted.order_id to capture the ID)
        const orderInsertRequest = new sql.Request(transaction);
        const result = await orderInsertRequest
            .input('username', sql.VarChar, authenticatedUsername)
            .input('order_qty', sql.Int, quantity)
            .input('order_date', sql.DateTime, date)
            .input('priority', sql.Int, priorityValue)
            .input('status_str', sql.VarChar, 'Pending')
            .input('dest_addr', sql.VarChar, dest)
            .input('wh_id', sql.Int, cData.warehouse_id)
            .input('insert_itemid', sql.Int, itemid)
            .query(`
                INSERT INTO Orders (
                    customer_name, product_id, quantity, order_date, 
                    priority_level, order_status, destination_address, 
                    warehouse_id
                ) 
                OUTPUT inserted.order_id
                VALUES (
                    @username, @insert_itemid, @order_qty, @order_date, 
                    @priority, @status_str, @dest_addr, 
                    @wh_id
                )
            `);

        const newOrderId = result.recordset[0].order_id;

        // 5. LOG RECENT ACTIVITY
        const activityRequest = new sql.Request(transaction);
        await activityRequest
            .input('act_wh_id', sql.Int, cData.warehouse_id)
            .input('type', sql.VarChar, 'Outbound Shipment')
            .input('ref', sql.VarChar, `ORD-${newOrderId}`)
            .input('act_qty', sql.Int, quantity)
            .input('status', sql.VarChar, 'Pending')
            .query(`
                INSERT INTO warehouse_activities 
                (warehouse_id, activity_type, reference_code, quantity, status, created_at)
                VALUES (@act_wh_id, @type, @ref, @act_qty, @status, GETDATE())
            `);

        await transaction.commit();
        
        return {
            success: true,
            message: 'Order Placed Successfully!' 
        };

    } catch (err) {
        if (transactionStarted) {
            try {
                await transaction.rollback();
            } catch (rollbackErr) {
                console.error("Rollback failed:", rollbackErr.message);
            }
        }
        console.error("Order processing failed:", err.message);
        throw err; 
    }
}

export async function updateOrderStatus(orderId, newStatus) {
    try {
        const pool = await establishConnection(config);

        // 1. Fetch order details for the activity log
        const orderData = await pool.request()
            .input('orderId', sql.Int, orderId)
            .query('SELECT warehouse_id, quantity FROM Orders WHERE order_id = @orderId');
        
        if (orderData.recordset.length === 0) throw new Error("Order not found");
        const { warehouse_id, quantity } = orderData.recordset[0];

        // 2. Update Order Status
        await pool.request()
            .input('updateOrderId', sql.Int, orderId)
            .input('newStatus', sql.VarChar, newStatus)
            .query(`UPDATE Orders SET order_status = @newStatus WHERE order_id = @updateOrderId`);

        // 3. Log Activity
        await pool.request()
            .input('wh_id', sql.Int, warehouse_id)
            .input('type', sql.VarChar, 'Outbound Shipment')
            .input('ref', sql.VarChar, `ORD-${orderId}`)
            .input('qty', sql.Int, quantity)
            .input('status', sql.VarChar, newStatus)
            .query(`
                INSERT INTO warehouse_activities 
                (warehouse_id, activity_type, reference_code, quantity, status, created_at)
                VALUES (@wh_id, @type, @ref, @qty, @status, GETDATE())
            `);

    } catch(err) {
        console.error("Order Status Update Error:", err.message);
        throw new Error("Failed to update order status.");
    }
}