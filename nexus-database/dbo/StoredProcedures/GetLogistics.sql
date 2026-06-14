CREATE PROCEDURE GetLogistics
(
    @Search VARCHAR(255) = '',
    @Status VARCHAR(50) = '',
    @Vehicle VARCHAR(50) = '',
    @Offset INT = 0,
    @Limit INT = 10
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        *,
        COUNT(*) OVER() AS totalItems
    FROM ActiveShipments
    WHERE
        (
            @Search = ''
            OR CAST(order_id AS VARCHAR(255)) LIKE '%' + @Search + '%'
            OR origin LIKE '%' + @Search + '%'
            OR destination LIKE '%' + @Search + '%'
            OR carrier LIKE '%' + @Search + '%'
        )
        AND (
            @Status = ''
            OR order_status = @Status
        )
        AND (
            @Vehicle = ''
            OR carrier = @Vehicle
        )
    ORDER BY order_id
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;
END
GO