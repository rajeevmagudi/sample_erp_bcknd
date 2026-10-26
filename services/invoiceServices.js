import pool from "../db.js";


// (async () => {
//     try {
//         const connection = await pool.getConnection();
//         console.log('✅ Connected to MySQL database successfully!');
//         connection.release(); 
//     } catch (error) {
//         console.error('❌ Database connection failed:', error.message);
//     }
// })();

class InvoiceService {
    
async getAllInvoice() {
    const [rows] = await pool.query(`
        SELECT 
            i.id AS invoice_id,
            i.inv_id,
            i.inv_date,
            i.due_date,
            i.status,
            i.subtotal,
            i.tax_amount,
            i.total,
            c.id AS customer_id,
            c.cname AS name, 
            c.email, 
            c.phone, 
            c.gst 
        FROM invoices i
        INNER JOIN customer c ON i.customer_id = c.id
    `);
    return rows;
}

async getFilteredInvoices(filters = {}) {
    const { status, startDate, endDate, search } = filters;
    let queryParams = [];
    
    let sql = `
        SELECT 
            i.id, i.inv_id, i.inv_date, i.due_date, i.status, i.total,
            c.cname AS customer_name,
            COALESCE(p.total_paid, 0.00) AS paid_amount,
            (i.total - COALESCE(p.total_paid, 0.00)) AS balance_amount
        FROM invoices i
        INNER JOIN customer c ON i.customer_id = c.id
        LEFT JOIN (
            SELECT invoice_id, SUM(amount_paid) AS total_paid 
            FROM payments 
            GROUP BY invoice_id
        ) p ON i.id = p.invoice_id
        WHERE 1=1
    `;

    if (status) {
        sql += ` AND i.status = ?`;
        queryParams.push(status);
    }
    if (startDate && endDate) {
        sql += ` AND i.inv_date BETWEEN ? AND ?`;
        queryParams.push(startDate, endDate);
    }
    if (search) {
        sql += ` AND (i.inv_id LIKE ? OR c.cname LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY i.created_at DESC`;
    console.log("query params", queryParams);

    const [rows] = await pool.query(sql, queryParams);
    return rows;
}

async createInvoiceWithPayment(invoiceData, items, paymentData) {
    const { customer_id, inv_date, due_date, subtotal, tax_amount, total } = invoiceData;
    const { amount_paid, payment_method, notes } = paymentData;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        //  Calculate Sequential Invoice ID
        const [countResult] = await connection.query('SELECT COUNT(*) AS totalRows FROM invoices');
        const inv_id = `INV-${countResult[0].totalRows + 1}`;

        //   initial status based on payment
        let status = 'draft';
        if (amount_paid >= total) status = 'paid';
        else if (amount_paid > 0) status = 'partially_paid';

        //  Insert Parent Invoice
        const [invoiceResult] = await connection.query(
            `INSERT INTO invoices 
            (customer_id, inv_id, inv_date, due_date, status, subtotal, tax_amount, total) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
            [customer_id, inv_id, inv_date, due_date, status, subtotal, tax_amount, total]
        );
        const invoiceInternalId = invoiceResult.insertId;

        //  Insert Line Items
        const itemInsertQuery = `INSERT INTO invoice_items (invoice_id, description, quantity, price, amount) VALUES (?, ?, ?, ?, ?)`;
        for (const item of items) {
            await connection.query(itemInsertQuery, [invoiceInternalId, item.description, item.quantity, item.price, item.quantity * item.price]);
        }

        //  Insert Initial Payment record (if any money was paid)
        if (amount_paid > 0) {
            await connection.query(
                `INSERT INTO payments (invoice_id, amount_paid, payment_method, notes) VALUES (?, ?, ?, ?)`,
                [invoiceInternalId, amount_paid, payment_method, notes]
            );
        }

        await connection.commit();
        return { id: invoiceInternalId, inv_id, status };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async getInvoiceItems(invoiceId) {
    const [rows] = await pool.query(
        `SELECT id, description, quantity, price, amount 
         FROM invoice_items 
         WHERE invoice_id = ?`, 
        [invoiceId]
    );
    return rows;
}


}

export default new InvoiceService();
