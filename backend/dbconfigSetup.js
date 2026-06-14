import dotenv from 'dotenv';
dotenv.config();
const config = {
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, 
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // Turn off for local dev
        trustServerCertificate: false, // Turn off for local dev 
    }
};

export default config;