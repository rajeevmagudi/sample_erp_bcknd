const express = require('express');
const app = express();
const customerRoutes = require('./routes/customerRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const PORT = 3000;

const cors = require('cors');

// Middleware to parse incoming JSON data
app.use(express.json());

const corsOptions = {
    origin: 'http://localhost:5173', // Allow only this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
    optionsSuccessStatus: 200 // For legacy browser support (IE11)
};

// Apply the restricted CORS options globally
app.use(cors(corsOptions));

app.post('/', (req, res) => {
    res.send('Welcome to Test ERP\'s Express API!');
});

app.use('/api/customer',customerRoutes);
app.use('/api/invoice',invoiceRoutes);
app.use('/api/payment',paymentRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running successfully on http://localhost:${PORT}`);
});
