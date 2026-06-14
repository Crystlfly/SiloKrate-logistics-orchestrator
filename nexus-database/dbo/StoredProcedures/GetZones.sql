CREATE PROCEDURE GetZones
(
    @Search VARCHAR(255) = '',
    @Type VARCHAR(100) = '',
    @Offset INT = 0,
    @Limit INT = 20
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        z.*,
        w.location_name AS warehouse_name,
        COUNT(*) OVER() AS totalItems
    FROM Zones z
    LEFT JOIN Warehouses w
        ON z.warehouse_id = w.warehouse_id
    WHERE
        z.IsDeleted = 0
        AND (
            @Search = ''
            OR z.zone_type LIKE '%' + @Search + '%'
            OR z.zone_name LIKE '%' + @Search + '%'
            OR w.location_name LIKE '%' + @Search + '%'
        )
        AND (
            @Type = ''
            OR @Type = 'All Types'
            OR z.zone_type = @Type
        )
    ORDER BY z.zone_id
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;
END
GO