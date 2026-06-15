CREATE TABLE [dbo].[Orders] (
    [order_id]            INT            IDENTITY (1, 1) NOT NULL,
    [customer_name]       NVARCHAR (255) NULL,
    [product_id]          INT            NULL,
    [quantity]            INT            NOT NULL,
    [order_date]          DATETIME       DEFAULT (getdate()) NULL,
    [priority_level]      INT            NULL,
    [order_status]        NVARCHAR (50)  DEFAULT ('Pending') NULL,
    [destination_address] NVARCHAR (255) NULL,
    [warehouse_id]        INT            NULL,
    [assigned_vehicle_id] INT            NULL,
    [packed_at]           DATETIME       NULL,  
    PRIMARY KEY CLUSTERED ([order_id] ASC),
    CHECK ([priority_level]=(3) OR [priority_level]=(2) OR [priority_level]=(1)),
    FOREIGN KEY ([product_id]) REFERENCES [dbo].[Products] ([product_id]),
    FOREIGN KEY ([warehouse_id]) REFERENCES [dbo].[Warehouses] ([warehouse_id])
);
GO

ALTER TABLE [dbo].[Orders] ADD CONSTRAINT [CK_OrderStatus] CHECK ([order_status]='Pending' OR [order_status]='Packed' OR [order_status]='Shipped' OR [order_status]='Delivered' OR [order_status]='Cancelled');