CREATE PROCEDURE GetFleet
(
    @Search VARCHAR(255) = '',
    @Type VARCHAR(100) = '',
    @Status VARCHAR(50) = '',
    @Offset INT = 0,
    @Limit INT = 10
)
AS
BEGIN
    SET NOCOUNT ON;

    ---------------------------------------------------
    -- Result Set 1 : Fleet Data
    ---------------------------------------------------
    SELECT
        f.*,
        w.location_name AS warehouse_location,
        COUNT(*) OVER() AS totalItems
    FROM Fleet f
    LEFT JOIN Warehouses w
        ON f.current_warehouse_id = w.warehouse_id
    WHERE
        f.IsDeleted = 0
        AND (
            @Search = ''
            OR f.vehicle_id LIKE '%' + @Search + '%'
            OR f.driver_name LIKE '%' + @Search + '%'
            OR f.current_route LIKE '%' + @Search + '%'
        )
        AND (
            @Type = ''
            OR @Type = 'All Types'
            OR f.vehicle_type LIKE '%' + @Type + '%'
        )
        AND (
            @Status = ''
            OR @Status = 'All Statuses'
            OR f.status = @Status
        )
    ORDER BY vehicle_id DESC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;

    ---------------------------------------------------
    -- Result Set 2 : Statistics
    ---------------------------------------------------
    SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) AS low,
        SUM(CASE WHEN status = 'In-Transit' THEN 1 ELSE 0 END) AS [over],
        SUM(CASE WHEN status = 'Idle' THEN 1 ELSE 0 END) AS [out]
    FROM Fleet
    WHERE IsDeleted = 0;

END
GO