CREATE PROCEDURE GetOrders
(
    @Search VARCHAR(255) = '',
    @Status VARCHAR(50) = '',
    @Priority INT = NULL,
    @Offset INT = 0,
    @Limit INT = 10
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM AllOrdersDetails
    WHERE
        (
            @Search = ''
            OR CAST(order_id AS VARCHAR(255)) LIKE '%' + @Search + '%'
            OR CAST(product_id AS VARCHAR(255)) LIKE '%' + @Search + '%'
            OR destination_address LIKE '%' + @Search + '%'
            OR customer_name LIKE '%' + @Search + '%'
        )
        AND (@Status = '' OR order_status = @Status)
        AND (@Priority IS NULL OR priority_level = @Priority)
    ORDER BY order_id DESC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;

    SELECT COUNT(*) AS total
    FROM AllOrdersDetails
    WHERE
        (
            @Search = ''
            OR CAST(order_id AS VARCHAR(255)) LIKE '%' + @Search + '%'
            OR CAST(product_id AS VARCHAR(255)) LIKE '%' + @Search + '%'
            OR destination_address LIKE '%' + @Search + '%'
            OR customer_name LIKE '%' + @Search + '%'
        )
        AND (@Status = '' OR order_status = @Status)
        AND (@Priority IS NULL OR priority_level = @Priority);
END