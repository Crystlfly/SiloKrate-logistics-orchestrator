import sql from 'mssql';
import { establishConnection } from '../utils/dbhelper.js';
import dbconfigSetup from '../dbconfigSetup.js';

const config = dbconfigSetup;

export async function addProduct(productData, authenticatedUsername) {
    if(!authenticatedUsername) {
        throw new Error("Cannot add product: User is not authenticated.");
    }
    try{
        const pool = await establishConnection(config);
        const {name, sku, reorderLevel, currentStock, unitPrice, category, status, volume}=productData;
        const total_vol=currentStock*volume;

        const warehouseRequest = pool.request();
        warehouseRequest.input('requiredVolume', sql.Float, total_vol);
        
        const warehouseResult = await warehouseRequest.query(`
            SELECT TOP 1 warehouse_id 
            FROM Warehouses 
            WHERE (total_capacity_sqft - used_capacity_sqft) >= @requiredVolume AND
            IsDeleted=0
            ORDER BY (total_capacity_sqft - used_capacity_sqft) DESC
        `);

        if (warehouseResult.recordset.length === 0) {
            throw new Error("No warehouse has enough capacity for this product.");
        }

        const warehouseId = warehouseResult.recordset[0].warehouse_id;

        const zoneid=pool.request();
        zoneid.input('wid', sql.Int, warehouseId);
        zoneid.input('requiredVolume', sql.Float, total_vol)
        const zoneResult= await zoneid.query(`
            select top 1 zone_id
            from zones 
            where warehouse_id=@wid And
            (capacity_limit-current_occupancy)>@requiredVolume AND
            IsDeleted=0
            ORDER BY (capacity_limit - current_occupancy) DESC
            `);
        const zoneId=zoneResult.recordset[0].zone_id;
        
        const insertResult = await pool.request()
            .input('name', sql.VarChar, name)
            .input('sku', sql.VarChar, sku)
            .input('reorderLevel', sql.Int, reorderLevel)
            .input('currentStock', sql.Int, currentStock)
            .input('unitPrice', sql.Decimal(18,2), unitPrice)
            .input('category', sql.VarChar, category)
            .input('status', sql.VarChar, status)
            .input('warehouseId', sql.Int, warehouseId)
            .input('zoneId', sql.Int, zoneId)
            .input('requiredVolume', sql.Float, total_vol)
            .input('per_volume', sql.Int, volume)
            .query(`
                INSERT INTO Products (name, sku, reorder_level, current_stock, unit_price, category, status, total_volume_occupancy, warehouse_id, zone_id, per_volume) 
                OUTPUT INSERTED.product_id
                VALUES (@name, @sku, @reorderLevel, @currentStock, @unitPrice, @category, @status, @requiredVolume, @warehouseId, @zoneId, @per_volume)

                UPDATE Warehouses 
                SET used_capacity_sqft = used_capacity_sqft + @requiredVolume
                WHERE warehouse_id = @warehouseId;

                UPDATE Zones
                SET current_occupancy = current_occupancy + @requiredVolume
                WHERE zone_id = @zoneId;
            `);

        if (insertResult.recordset && insertResult.recordset[0]) {
            const newProductId = insertResult.recordset[0].product_id;

            // --- LOGGing RECENT ACTIVITY ---
            await pool.request()
                .input('wh_id', sql.Int, warehouseId)
                .input('type', sql.VarChar, 'Inbound Receipt')
                .input('ref', sql.VarChar, sku) 
                .input('qty', sql.Int, currentStock)
                .input('status', sql.VarChar, 'Completed')
                .query(`
                    INSERT INTO warehouse_activities 
                    (warehouse_id, activity_type, reference_code, quantity, status, created_at)
                    VALUES (@wh_id, @type, @ref, @qty, @status, GETDATE())
                `);

            return { 
                status: "success", 
                message: "Product added successfully",
                productId: newProductId 
            };
        } else {
            throw new Error("Error adding product");
        }
    }catch(err){
        throw err;
    }
}

export async function updateProduct(productId, productData) {
    try {
        const pool = await establishConnection(config);
        const { name, sku, reorderLevel, currentStock, unitPrice, category, status } = productData;
        
        const existingData = await pool.request()
            .input('id', sql.Int, productId)
            .query('SELECT warehouse_id FROM Products WHERE product_id = @id');
        
        const warehouseId = existingData.recordset[0]?.warehouse_id;

        await pool.request()
            .input('id', sql.Int, productId)
            .input('name', sql.VarChar, name)
            .input('sku', sql.VarChar, sku)
            .input('reorderLevel', sql.Int, reorderLevel)
            .input('currentStock', sql.Int, currentStock)
            .input('unitPrice', sql.Decimal(18, 2), unitPrice)
            .input('category', sql.VarChar, category)
            .input('status', sql.VarChar, status)
            .query(`
                UPDATE Products 
                SET name = @name, sku = @sku, reorder_level = @reorderLevel, 
                    current_stock = @currentStock, unit_price = @unitPrice, 
                    category = @category, status = @status
                WHERE product_id = @id
            `);

        if (warehouseId) {
            await pool.request()
                .input('wh_id', sql.Int, warehouseId)
                .input('type', sql.VarChar, 'Stock Adjustment')
                .input('ref', sql.VarChar, sku)
                .input('qty', sql.Int, currentStock)
                .input('status', sql.VarChar, 'Updated')
                .query(`
                    INSERT INTO warehouse_activities 
                    (warehouse_id, activity_type, reference_code, quantity, status, created_at)
                    VALUES (@wh_id, @type, @ref, @qty, @status, GETDATE())
                `);
        }

        return { status: "success", message: "Product updated successfully" };
    } catch (err) {
        throw err;
    }
}

export async function deleteProduct(productId) {
    try {
        const pool = await establishConnection(config);
        await pool.request()
            .input('id', sql.Int, productId)
            .query('UPDATE Products SET isDeleted=1 WHERE product_id = @id');
            
        return { status: "success", message: "Product deleted successfully" };
    } catch (err) {
        throw err;
    }
}