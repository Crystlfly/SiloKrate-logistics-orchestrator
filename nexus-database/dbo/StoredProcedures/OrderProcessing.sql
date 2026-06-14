CREATE PROCEDURE OrderProcessing
@username NVARCHAR(255),
@productId INT,
@qty INT,
@date DATETIME,
@priority INT,
@destination NVARCHAR(255)
AS
SET NOCOUNT ON;
BEGIN TRY
BEGIN TRANSACTION;
    -- 1. Declare a variable for each piece of data
DECLARE @CurrentStock INT;
DECLARE @WarehouseId INT;
DECLARE @ZoneId INT;
DECLARE @PerVolume INT; -- Adjust the data type to match your table

-- 2. Populate them all in one clean SELECT statement
SELECT 
    @CurrentStock = current_stock, 
    @WarehouseId = warehouse_id, 
    @ZoneId = zone_id, 
    @PerVolume = per_volume 
FROM Products
WHERE product_id = @productId AND IsDeleted = 0;

IF @CurrentStock IS NULL
    THROW 50001, 'Product not found.', 1;
            
IF @CurrentStock < @qty
    THROW 50002, 'Insufficient stock available.', 1;

IF @CurrentStock>= @qty
BEGIN
    -- 3. Calculate the total volume needed for the order
    DECLARE @TotalVolume INT;
    SET @TotalVolume = @qty * @PerVolume;

    UPDATE Products
    SET current_stock = current_stock - @qty
    WHERE product_id = @productId AND IsDeleted = 0;

    UPDATE Warehouses
    SET used_capacity_sqft = used_capacity_sqft - @TotalVolume
    WHERE warehouse_id = @WarehouseId;

    UPDATE Zones
    SET current_occupancy = current_occupancy - @TotalVolume
    WHERE zone_id = @ZoneId;

    -- 4. Insert the order details into the Orders table
    INSERT INTO Orders (customer_name, product_id, quantity, order_date, 
                    priority_level, order_status, destination_address, 
                    warehouse_id)
    VALUES (@username, @productId, @qty, @date, @priority, 'Pending', @destination, @WarehouseId);

END
COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    -- Optionally, you can log the error or return an error message
    THROW;
END CATCH;
GO

