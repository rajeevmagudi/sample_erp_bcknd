import pool from "../db.js";

class PaymentServices{

    async addPayment(invoiceId, amountPaid, paymentMethod, notes) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Lock the row to prevent race conditions during calculation
            const [invoiceRows] = await connection.query(
                `SELECT i.total, COALESCE(SUM(p.amount_paid), 0.00) AS total_paid
                FROM invoices i
                LEFT JOIN payments p ON i.id = p.invoice_id
                WHERE i.id = ?
                GROUP BY i.id`, [invoiceId]
            );

            if (invoiceRows.length === 0) throw new Error("Invoice not found");

            const { total, total_paid } = invoiceRows[0];
            const currentBalance = parseFloat(total) - parseFloat(total_paid);

            // STRICT GATEWAY: Block overpayments
            if (amountPaid > currentBalance) {
                throw new Error(`Overpayment blocked. Remaining balance is ₹${currentBalance.toFixed(2)}, but you tried to pay ₹${amountPaid.toFixed(2)}.`);
            }

            // Insert payment log
            await connection.query(
                `INSERT INTO payments (invoice_id, amount_paid, payment_method, notes) VALUES (?, ?, ?, ?)`,
                [invoiceId, amountPaid, paymentMethod, notes]
            );

            // Calculate new status
            const finalPaid = parseFloat(total_paid) + parseFloat(amountPaid);
            let newStatus = 'partially_paid';
            if (finalPaid >= parseFloat(total)) {
                newStatus = 'paid';
            }

            // Update main status field
            await connection.query(`UPDATE invoices SET status = ? WHERE id = ?`, [newStatus, invoiceId]);

            await connection.commit();
            return { message: "Payment processed successfully", newBalance: currentBalance - amountPaid, status: newStatus };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async getCustomerOutstandings() {
        const [rows] = await pool.query(`
            SELECT 
                c.id AS customer_id,
                c.cname AS customer_name,
                c.phone,
                c.email,
                COALESCE(SUM(i.total), 0.00) AS total_billed,
                COALESCE(SUM(p.total_paid), 0.00) AS total_paid,
                (COALESCE(SUM(i.total), 0.00) - COALESCE(SUM(p.total_paid), 0.00)) AS outstanding_amount
            FROM customer c
            INNER JOIN invoices i ON c.id = i.customer_id
            LEFT JOIN (
                SELECT invoice_id, SUM(amount_paid) AS total_paid 
                FROM payments 
                GROUP BY invoice_id
            ) p ON i.id = p.invoice_id
            GROUP BY c.id
            HAVING outstanding_amount > 0
            ORDER BY outstanding_amount DESC
        `);
        return rows;
    }

}

export default new PaymentServices();