CREATE TABLE [dbo].[Users] (
    [UserId]           UNIQUEIDENTIFIER NULL,
    [FullName]         NVARCHAR (100)   NULL,
    [Email]            NVARCHAR (255)   NULL,
    [PasswordHash]     NVARCHAR (MAX)   NULL,
    [GoogleId]         NVARCHAR (100)   NULL,
    [Role]             VARCHAR (50)     NULL,
    [ResetToken]       NVARCHAR (255)   NULL,
    [ResetTokenExpiry] DATETIME         NULL,
    [RequirePasswordChange] BIT              DEFAULT ((1)) NULL,
    [IsDeleted]        BIT              DEFAULT ((0)) NULL
);
GO

ALTER TABLE [dbo].[Users]
    ADD CONSTRAINT [chk_UserRole] CHECK ([Role]='warehouse_staff' OR [Role]='warehouse_manager' OR [Role]='logistics_manager' OR [Role]='inventory_manager' OR [Role]='inventory_staff' OR [Role]='system_admin' );
GO

