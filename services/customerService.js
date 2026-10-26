import pool from "../db.js";


(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected to MySQL database successfully!');
        connection.release(); 
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    }
})();

class CustomerService {
    

    // Fetch all users from database
    async getAllCustomers() {
        const [rows] = await pool.query('SELECT id, cname as name, email, phone, gst FROM customer');
        return rows;
    }

    // Insert a new user into database
    async createCustomer(name, email, phone, gst) {
        console.log("servic hitted");
        const [result] = await pool.query(
            'INSERT INTO customer (cname, email, phone, gst) VALUES (?, ?, ?, ?)', 
            [name, email, phone, gst]
        );
        return { id: result.insertId, name, email, phone, gst };
    }
}

export default new CustomerService();
