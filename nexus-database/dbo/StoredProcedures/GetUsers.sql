CREATE PROCEDURE GetUsers
(
    @Search VARCHAR(255) = '',
    @Category VARCHAR(100) = '',
    @Offset INT = 0,
    @Limit INT = 10
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        UserId,
        FullName,
        Email,
        Role,
        COUNT(*) OVER() AS totalItems
    FROM Users
    WHERE
        IsDeleted = 0
        AND (
            @Search = ''
            OR FullName LIKE '%' + @Search + '%'
            OR Email LIKE '%' + @Search + '%'
            OR Role LIKE '%' + @Search + '%'
        )
        AND (
            @Category = ''
            OR @Category = 'All Roles'
            OR Role = @Category
        )
    ORDER BY UserId
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;
END
GO