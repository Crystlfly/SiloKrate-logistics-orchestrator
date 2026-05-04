import dotenv from 'dotenv';
dotenv.config();
const config = {
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, 
    database: process.env.DB_NAME,
    options: {
        instanceName: 'SQLEXPRESS01', // Explicitly tell Node the instance here
        encrypt: false, // Turn off for local dev
        trustServerCertificate: true 
    }
};

export default config;