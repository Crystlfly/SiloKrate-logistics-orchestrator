import sql from 'mssql';
import { establishConnection } from '../utils/dbHelper.js';
import dbconfigSetup from '../dbconfigSetup.js';

const config = dbconfigSetup;

export async function addFleet(fleetData, authenticatedUsername) {
    if(!authenticatedUsername) {
        throw new Error("Cannot add fleet: User is not authenticated.");
    }
    try{
        const pool = await establishConnection(config);
        const { driverName, vehicle_type, status, currentWarehouseId, fuelLevel, progress, currentRoute, odometer } = fleetData;

        const insertResult = await pool.request()
            .input('driverName', sql.VarChar, driverName)
            .input('vehicleType', sql.VarChar, vehicle_type)
            .input('status', sql.VarChar, status)
            .input('currentWarehouseId', sql.Int, currentWarehouseId)
            .input('fuelLevel', sql.Int, fuelLevel)
            .input('progress', sql.Int, progress)
            .input('currentRoute', sql.VarChar, currentRoute)
            .input('odometer', sql.Int, odometer)
            .query(`
                INSERT INTO Fleet (driver_name, vehicle_type, status, current_warehouse_id, fuel_level, progress, current_route, odometer) 
                OUTPUT inserted.vehicle_id
                VALUES (@driverName, @vehicleType, @status, @currentWarehouseId, @fuelLevel, @progress, @currentRoute, @odometer)
            `);
        if (insertResult.recordset && insertResult.recordset[0]) {
            return { 
                status: "success", 
                message: "Fleet added successfully",
                vehicleId: insertResult.recordset[0].vehicleId 
            };
        } else {
            throw new Error("Error adding fleet");
        }
    }catch(err){
        if (err.number === 547) {
            throw new Error(`Warehouse ID ${fleetData.currentWarehouseId} does not exist.`);
        }
        throw err;
    }
}

export async function updateFleet(vehicleId, fleetData) {
    try {
        const pool = await establishConnection(config);
        const { driverName, vehicle_type, status, currentWarehouseId, fuelLevel, progress, currentRoute, odometer } = fleetData;
        await pool.request()
            .input('id', sql.Int, vehicleId)
            .input('driverName', sql.VarChar, driverName)
            .input('vehicleType', sql.VarChar, vehicle_type)
            .input('status', sql.VarChar, status)
            .input('currentWarehouseId', sql.Int, currentWarehouseId)
            .input('fuelLevel', sql.Int, fuelLevel)
            .input('progress', sql.Int, progress)
            .input('currentRoute', sql.VarChar, currentRoute)
            .input('odometer', sql.Int, odometer)
            .query(`
                UPDATE Fleet 
                SET driver_name = @driverName, vehicle_type = @vehicleType, status = @status,
                    current_warehouse_id = @currentWarehouseId, fuel_level = @fuelLevel,
                    progress = @progress, current_route = @currentRoute, odometer = @odometer
                WHERE vehicle_id = @id
            `);

        return { status: "success", message: "Fleet updated successfully" };
    } catch (err) {
        throw err;
    }
}

export async function deleteFleet(vehicleId) {
    try {
        const pool = await establishConnection(config);
        await pool.request()
            .input('id', sql.Int, vehicleId)
            .query('UPDATE Fleet SET isDeleted=1 WHERE vehicle_id = @id');
        return { status: "success", message: "Fleet deleted successfully" };
    } catch (err) {
        throw err;
    }
}