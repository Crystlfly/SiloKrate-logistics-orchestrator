CREATE PROCEDURE [dbo].[Packed-to-Shipped]
@OrderId INT
AS 
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @AvailableFleet INT;
        SELECT TOP 1 @AvailableFleet= vehicle_id FROM Fleet WITH (UPDLOCK, ROWLOCK)
        WHERE Status = 'Idle' AND IsDeleted = 0
        ORDER BY vehicle_id ASC;

        IF @AvailableFleet IS NOT NULL
        BEGIN 
            UPDATE Orders
            Set order_status='Shipped', assigned_vehicle_id=@AvailableFleet
            WHERE order_id=@OrderId;

            UPDATE Fleet
            SET Status = 'In Transit', current_route = (SELECT destination_address FROM Orders WHERE order_id = @OrderId)
            WHERE vehicle_id = @AvailableFleet;
        END
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO