import sql from 'mssql';
import { establishConnection } from '../utils/dbHelper.js';
import dbconfigSetup from '../dbconfigSetup.js';

const config = dbconfigSetup;

export async function addWarehouse(warehouseData, authenticatedUsername) {
    if(!authenticatedUsername) {
        throw new Error("Cannot add warehouse: User is not authenticated.");
    }
    try{
        const pool = await establishConnection(config);
        
        const name = warehouseData.name;
        const latitude = parseFloat(warehouseData.latitude);
        const longitude = parseFloat(warehouseData.longitude);
        const operating_cost = parseFloat(warehouseData.operating_cost);
        
        const total_capacity = parseInt(warehouseData.total_capacity, 10);
        const used_capacity = parseInt(warehouseData.used_capacity, 10);
        const total_staff = parseInt(warehouseData.total_staff, 10);
        
        const { warehouse_type, status } = warehouseData;

        if (isNaN(latitude) || isNaN(longitude)) {
             throw new Error("Invalid Latitude or Longitude values.");
        }

        if (latitude < -90 || latitude > 90) {
            throw new Error("Invalid Latitude: Must be between -90 and 90.");
        }
        if (longitude < -180 || longitude > 180) {
            throw new Error("Invalid Longitude: Must be between -180 and 180.");
        }

        const insertResult = await pool.request()
            .input('location', sql.VarChar, name)
            .input('latitude', sql.Decimal(9,6), latitude)
            .input('longitude', sql.Decimal(9,6), longitude)
            .input('operatingCost', sql.Decimal(18,2), operating_cost)
            .input('type', sql.VarChar, warehouse_type)
            .input('totalCapacity', sql.Int, total_capacity)
            .input('usedCapacity', sql.Int, used_capacity)
            .input('staff', sql.Int, total_staff)
            .input('status', sql.VarChar, status)
            .query(`
                INSERT INTO Warehouses (location_name, latitude, longitude, operating_cost_per_day, warehouse_type, total_capacity_sqft, used_capacity_sqft, total_staff, status) 
                OUTPUT inserted.warehouse_id
                VALUES (@location, @latitude, @longitude, @operatingCost, @type, @totalCapacity, @usedCapacity, @staff,@status)
            `);
        if (insertResult.recordset && insertResult.recordset[0]) {
            return { 
                status: "success", 
                message: "Warehouse added successfully",
                warehouseId: insertResult.recordset[0].warehouse_id 
            };
        } else {
            throw new Error("Error adding warehouse", insertResult);
        }
    }catch(err){
        throw err;
    }
}

export async function updateWarehouse(warehouseId, warehouseData) {
    try {
        const pool = await establishConnection(config);
        const { location, latitude, longitude, operatingCost, type, totalCapacity, usedCapacity, staff, status } = warehouseData;
        await pool.request()
            .input('id', sql.Int, warehouseId)
            .input('location', sql.VarChar, location)
            .input('latitude', sql.Float, latitude)
            .input('longitude', sql.Float, longitude)
            .input('operatingCost', sql.Decimal(18,2), operatingCost)
            .input('type', sql.VarChar, type)
            .input('totalCapacity', sql.Int, totalCapacity)
            .input('usedCapacity', sql.Int, usedCapacity)
            .input('staff', sql.Int, staff)
            .input('status', sql.VarChar, status)
            .query(`
                UPDATE Warehouses 
                SET location_name = @location, latitude = @latitude, longitude = @longitude,
                    operating_cost_per_day = @operatingCost, warehouse_type = @type,
                    total_capacity_sqft = @totalCapacity, used_capacity_sqft = @usedCapacity,
                    total_staff = @staff, status = @status
                WHERE warehouse_id = @id
            `);
    } catch (err) {
        throw err;
    }
}

export async function deleteWarehouse(warehouseId) {
    try {
        const pool = await establishConnection(config);
        await pool.request()
            .input('id', sql.Int, warehouseId)
            .query(`UPDATE Warehouses SET isDeleted=1 WHERE warehouse_id = @id`);
    } catch (err) {
        throw err;
    }
}