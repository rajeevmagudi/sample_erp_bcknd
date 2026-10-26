const express = require('express');
const { default: customerService } = require('../services/customerService');
const router = express.Router();

// GET all customers (http://localhost:3000/api/customers)
router.get('/', async (req, res) => {
    try {
        const customers = await customerService.getAllCustomers();
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: 'Database operation failed', details: error.message });
    }
});

// POST a new customer (http://localhost:3000/api/customer)
router.post('/', async (req, res) => {
    console.log("customer logs")
    const { name, email, phone, gst } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required fields.' });
    }

    try {
        const newCustomer = await customerService.createCustomer(name, email, phone, gst);
        res.status(201).json(newCustomer);
    } catch (error) {
        res.status(500).json({ error: 'Database operation failed', details: error.message });
    }
});

module.exports = router;
