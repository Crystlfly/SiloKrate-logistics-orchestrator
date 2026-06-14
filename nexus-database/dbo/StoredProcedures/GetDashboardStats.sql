CREATE PROCEDURE GetDashboardStats
AS
BEGIN
    SET NOCOUNT ON;

    -- Active Orders
    SELECT COUNT(*) AS totalActiveOrders
    FROM Orders
    WHERE order_status NOT IN ('Completed', 'Delivered');

    -- Critical Alerts
    SELECT COUNT(*) AS criticalAlerts
    FROM Products
    WHERE current_stock <= reorder_level
      AND IsDeleted = 0;

    -- Inventory Health
    SELECT TOP 5
        name,
        current_stock,
        reorder_level,
        warehouse_id
    FROM Products
    WHERE IsDeleted = 0
    ORDER BY
        CASE
            WHEN current_stock <= reorder_level THEN 0
            ELSE 1
        END,
        current_stock ASC;

    -- Fleet Stats
    SELECT
        COUNT(vehicle_id) AS totalFleet,
        SUM(CASE WHEN status = 'Idle' THEN 1 ELSE 0 END) AS idleCount,
        SUM(CASE WHEN status = 'In Transit' THEN 1 ELSE 0 END) AS inTransitCount,
        SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) AS maintenanceCount
    FROM Fleet
    WHERE IsDeleted = 0;

    -- Warehouse Uptime
    SELECT
        COUNT(warehouse_id) AS totalHubs,
        SUM(CASE WHEN status = 'Operational' THEN 1 ELSE 0 END) AS operationalHubs
    FROM Warehouses
    WHERE IsDeleted = 0;
END
GO