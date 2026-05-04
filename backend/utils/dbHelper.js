import sql from "mssql"
const Max_retries = 5;
export async function establishConnection(config, retries=Max_retries){
    try{
        const pool=await sql.connect(config);
        return pool;
    }catch(err){
        if(retries<=0){
            console.error("Database connection failed after multiple attempts:", err);
            throw new Error("Database connection failed");
        }
        await new Promise(res=>setTimeout(res, 2000));
        return establishConnection(config, retries-1);
    }
}