CREATE PROCEDURE GetInventory
(
    @Search VARCHAR(255) = '',
    @Category VARCHAR(100) = '',
    @Status VARCHAR(50) = '',
    @Offset INT = 0,
    @Limit INT = 10
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        *,
        COUNT(*) OVER() AS totalItems
    FROM Products
    WHERE
        IsDeleted = 0
        AND (
            @Search = ''
            OR sku LIKE '%' + @Search + '%'
            OR name LIKE '%' + @Search + '%'
            OR category LIKE '%' + @Search + '%'
        )
        AND (
            @Category = ''
            OR @Category = 'All Categories'
            OR category = @Category
        )
        AND (
            @Status = ''
            OR @Status = 'All Statuses'
            OR status = @Status
        )
    ORDER BY product_id DESC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;

    SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Low Stock' THEN 1 ELSE 0 END) AS low,
        SUM(CASE WHEN status = 'In-Stock' THEN 1 ELSE 0 END) AS [over],
        SUM(CASE WHEN status = 'Out of Stock' THEN 1 ELSE 0 END) AS [out]
    FROM Products
    WHERE IsDeleted = 0;

END
GO