const express = require('express');
const { default: paymentServices } = require('../services/paymentServices');
const router = express.Router();

// GET all invoice (http://localhost:3000/api/invoice)

router.post('/api/payments', async (req, res) => {
    const { invoice_id, amount_paid, payment_method, notes } = req.body;
    try {
        const result = await paymentServices.addPayment(
            invoice_id, parseFloat(amount_paid), payment_method, notes
        );
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Route to get collections report
router.get('/api/reports/outstanding', async (req, res) => {
    try {
        const report = await paymentServices.getCustomerOutstandings();
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: "Failed to generate outstanding balance dashboard" });
    }
});



module.exports = router;
