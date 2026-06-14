import sql from 'mssql';
import dbconfigSetup from '../dbconfigSetup.js';

const config = dbconfigSetup;

// EVENT A: Pack Order and Attempt Dispatch
export const packOrderAndDispatch = async (targetOrderId) => {
    const pool = await sql.connect(config);
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        const request = new sql.Request(transaction);
        request.input('targetOrderId', sql.Int, targetOrderId);

        // 1. Mark Order as Packed and set packed_at. 
        // We also grab the destination_address right now so we can give it to the driver!
        const orderUpdateResult = await request.query(`
            UPDATE Orders 
            SET order_status = 'Packed', packed_at = GETDATE()
            OUTPUT INSERTED.destination_address
            WHERE order_id = @targetOrderId AND order_status != 'Packed';
        `);

        // If the order was already packed, stop here.
        if (orderUpdateResult.recordset.length === 0) {
            await transaction.rollback();
            return { status: 400, message: "Order is already packed or does not exist." };
        }

        const targetOrderLocation = orderUpdateResult.recordset[0].destination_address;
        request.input('targetOrderLocation', sql.NVarChar, targetOrderLocation);

        // 2. Look for an Idle vehicle securely
        const vehicleResult = await request.query(`
            SELECT TOP 1 vehicle_id 
            FROM Fleet WITH (UPDLOCK, READPAST)
            WHERE status = 'Idle';
        `);

        if (vehicleResult.recordset.length > 0) {
            const assignedVehicleId = vehicleResult.recordset[0].vehicle_id;
            request.input('assignedVehicleId', sql.Int, assignedVehicleId);

            // Dispatch immediately
            await request.query(`
                UPDATE Orders
                SET order_status = 'In Transit', assigned_vehicle_id = @assignedVehicleId
                WHERE order_id = @targetOrderId;
            `);

            // Update Fleet with BOTH status and the route!
            await request.query(`
                UPDATE Fleet
                SET status = 'In Transit', current_route = @targetOrderLocation
                WHERE vehicle_id = @assignedVehicleId;
            `);

            await transaction.commit();
            return { status: 200, message: "Order packed and dispatched immediately.", vehicleId: assignedVehicleId };
        }

        // No vehicle available, just wait in queue
        await transaction.commit();
        return { status: 200, message: "Order packed and queued. Waiting for an available vehicle." };

    } catch (err) {
        await transaction.rollback();
        throw new Error("Failed to process order packing: " + err.message);
    }
};

// EVENT B: Vehicle Goes Idle and Attempts to Grab an Order
export const setVehicleIdleAndMatch = async (newlyFreedVehicleId) => {
    const pool = await sql.connect(config);
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        const request = new sql.Request(transaction);
        request.input('newlyFreedVehicleId', sql.Int, newlyFreedVehicleId);

        // 1. Find oldest waiting order
        const orderResult = await request.query(`
            SELECT TOP 1 order_id, destination_address
            FROM Orders WITH (UPDLOCK, READPAST)
            WHERE order_status = 'Packed'
            ORDER BY packed_at ASC;
        `);

        if (orderResult.recordset.length > 0) {
            const targetOrderId = orderResult.recordset[0].order_id;
            const targetOrderLocation = orderResult.recordset[0].destination_address;
            
            request.input('targetOrderId', sql.Int, targetOrderId);
            request.input('targetOrderLocation', sql.NVarChar, targetOrderLocation);

            // Assign newly freed vehicle to this order
            await request.query(`
                UPDATE Orders
                SET order_status = 'In Transit', assigned_vehicle_id = @newlyFreedVehicleId
                WHERE order_id = @targetOrderId;
            `);

            // Give the driver their new route
            await request.query(`
                UPDATE Fleet
                SET status = 'In Transit', current_route = @targetOrderLocation
                WHERE vehicle_id = @newlyFreedVehicleId;
            `);

            await transaction.commit();
            return { status: 200, message: "Vehicle marked idle and instantly reassigned.", orderId: targetOrderId };
        }

        // No orders waiting, let vehicle rest.
        await request.query(`
            UPDATE Fleet
            SET status = 'Idle', current_route = 'Unassigned'
            WHERE vehicle_id = @newlyFreedVehicleId;
        `);

        await transaction.commit();
        return { status: 200, message: "Vehicle marked idle. No pending orders." };

    } catch (err) {
        await transaction.rollback();
        throw new Error("Failed to update vehicle status: " + err.message);
    }
};