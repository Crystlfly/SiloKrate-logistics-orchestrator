CREATE PROCEDURE GetWarehouses
(
    @Search VARCHAR(255) = '',
    @Type VARCHAR(100) = '',
    @Offset INT = 0,
    @Limit INT = 10
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        *,
        COUNT(*) OVER() AS totalItems
    FROM Warehouses
    WHERE
        IsDeleted = 0
        AND (
            @Search = ''
            OR location_name LIKE '%' + @Search + '%'
            OR warehouse_type LIKE '%' + @Search + '%'
            OR CAST(warehouse_id AS VARCHAR(255)) LIKE '%' + @Search + '%'
        )
        AND (
            @Type = ''
            OR @Type = 'All Types'
            OR warehouse_type = @Type
        )
    ORDER BY warehouse_id
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;
END
GO