const express = require('express');
const { default: invoiceServices } = require('../services/invoiceServices');
const router = express.Router();

// GET all invoice (http://localhost:3000/api/invoice)
router.get('/', async (req, res) => {
    try {
        console.log("get invoice rourer");
        const invoices = await invoiceServices.getFilteredInvoices(req.query);
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ error: 'Database operation failed', details: error.message });
    }
});

// POST a new invoice (http://localhost:3000/api/invoice)
router.post('/', async (req, res) => {
    console.log("invoice logs")
    const { invoiceData, items, paymentData} = req.body;
    
    try {
        const newInvoice = await invoiceServices.createInvoiceWithPayment( invoiceData, items, paymentData);
        res.status(201).json(newInvoice);
    } catch (error) {
        res.status(500).json({ error: 'Database operation failed', details: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const items = await invoiceServices.getInvoiceItems(req.params.id);
        res.json(items);
    } catch (error) {
        console.error("Failed to fetch items:", error);
        res.status(500).json({ error: "Failed to load invoice line items." });
    }
});



module.exports = router;
