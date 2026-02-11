const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/semantic_search';
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://127.0.0.1:8000';

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Database Connection
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const RecordSchema = new mongoose.Schema({
    type: String,
    data: mongoose.Schema.Types.Mixed,
    embedding: [Number]
}, { timestamps: true });

// Text index for basic search
RecordSchema.index({
    "data.name": "text",
    "data.department": "text",
    "data.city": "text",
    "data.bio": "text",
    "data.description": "text",
    "data.preference": "text"
});

const Record = mongoose.model('Record', RecordSchema);

// Helper: Escape Regex characters to prevent injection
const escapeRegex = (text) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

app.get('/', (req, res) => res.json({ status: 'Search API Online' }));

app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Record.distinct('type');
        res.json({ categories });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/search', async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Query text is required' });

    try {
        let results = [];
        let method = 'Unknown';
        let mqlResponse = null; // Defined in outer scope

        // 1. Attempt "Prompt Engineering" / Text-to-MQL (Roadmap Alignment)
        try {
            console.log(`Attempting Text-to-MQL for: "${text}"`);
            mqlResponse = await axios.post(`${NLP_SERVICE_URL}/generate-mql`, { text });

            if (mqlResponse.data && mqlResponse.data.mql && Object.keys(mqlResponse.data.mql).length > 0) {
                console.log('MQL Generated:', JSON.stringify(mqlResponse.data.mql));
                try {
                    results = await Record.find(mqlResponse.data.mql).limit(10);
                    console.log(`MQL Execution Results: ${results.length} records`);
                    if (results.length > 0) {
                        method = 'Syntactic Translation (Precise)';
                    }
                } catch (dbErr) {
                    console.error('MQL Execution Failed:', dbErr.message);
                    // Do not crash, let it fall through to vector/text search
                }
            }
        } catch (mqlErr) {
            console.warn('MQL Generation failed/skipped:', mqlErr.message);
        }

        // 2. Fallback to Vector Search (Semantic) if MQL failed or found nothing
        if (results.length === 0) {
            try {
                console.log('Falling back to Vector Search...');
                const vectorResponse = await axios.post(`${NLP_SERVICE_URL}/embed`, { text });
                const embedding = vectorResponse.data.embedding;

                results = await Record.aggregate([
                    {
                        "$vectorSearch": {
                            "index": "vector_index",
                            "path": "embedding",
                            "queryVector": embedding,
                            "numCandidates": 100,
                            "limit": 10
                        }
                    }
                ]);
                if (results.length > 0) {
                    method = 'Semantic Vector Match';
                }
            } catch (vecErr) {
                console.warn('Vector search failed, falling back to text search:', vecErr.message);


                // 3. Last Result: Text Search
                const regexConditions = [
                    { "type": { $regex: escapeRegex(text), $options: 'i' } }, // Re-added Type search
                    { "data.name": { $regex: escapeRegex(text), $options: 'i' } },
                    { "data.department": { $regex: escapeRegex(text), $options: 'i' } },
                    { "data.city": { $regex: escapeRegex(text), $options: 'i' } },
                    { "data.country": { $regex: escapeRegex(text), $options: 'i' } }, // Added Country
                    { "data.bio": { $regex: escapeRegex(text), $options: 'i' } },
                    { "data.description": { $regex: escapeRegex(text), $options: 'i' } },
                    { "data.preference": { $regex: escapeRegex(text), $options: 'i' } },
                    { "data.status": { $regex: escapeRegex(text), $options: 'i' } } // Added Status
                ];
                results = await Record.find({ $or: regexConditions }).limit(10);
                method = 'Keyword Fuzzy Match';
            }
        }

        // Smart Suggestions
        let suggestion = null;
        if (results.length === 0) {
            const terms = ['sales', 'marketing', 'tech', 'manager', 'pending', 'usa', 'india'];
            suggestion = `No matches found. Try '${terms[Math.floor(Math.random() * terms.length)]}' or check for typos.`;
        }

        res.json({
            count: results.length,
            query: text,
            method,
            generatedMql: method.includes('Syntactic') ? mqlResponse?.data?.mql : null, // Send back the MQL
            suggestion,
            results: results.map(r => ({ ...r.data, _id: r._id, type: r.type }))
        });

    } catch (err) {
        console.error('Search Error:', err);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

// Database Connection Endpoint
app.post('/api/connect', async (req, res) => {
    const { uri } = req.body;
    if (!uri) return res.status(400).json({ error: 'URI is required' });

    try {
        await mongoose.disconnect();
        await mongoose.connect(uri);
        console.log(`Switched database to: ${uri}`);

        // Re-ensure index exists on new DB
        try {
            await Record.collection.createIndex({
                "data.name": "text",
                "data.department": "text",
                "data.city": "text",
                "data.bio": "text",
                "data.description": "text",
                "data.preference": "text"
            });
        } catch (idxErr) {
            console.warn('Index creation warning:', idxErr.message);
        }

        res.json({ message: 'Database connected successfully' });
    } catch (err) {
        console.error('Database switch error:', err);
        res.status(500).json({ error: `Connection failed: ${err.message}` });
    }
});

// Database Seeding
app.post('/api/seed', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Seeding disabled in production' });
    }

    try {
        await Record.deleteMany({});
        // ... (Seeding logic simplified for brevity, assume similar to before) ...
        // Re-adding the seeding logic briefly to ensure functionality

        const rawSamples = [
            { type: 'Employee', data: { name: 'Dr. Sarah Chen', department: 'R&D', salary: 150000, city: 'San Francisco', country: 'USA', bio: 'Expert in quantum computing.', status: 'Active' } },
            { type: 'Employee', data: { name: 'Marcus Johnson', department: 'Sales', salary: 85000, city: 'New York', country: 'USA', bio: 'Top performer in sales.', status: 'Active' } },
            { type: 'Order', data: { orderId: 'ORD-2024-001', amount: 5000, status: 'Processing', city: 'Tokyo', country: 'Japan', description: 'Bulk order of servers.' } },
            { type: 'Customer', data: { name: 'TechGiant Corp', city: 'Seattle', country: 'USA', email: 'procurement@techgiant.com', preference: 'High-volume purchaser.' } }
        ];

        const samplesWithEmbeddings = await Promise.all(rawSamples.map(async (sample) => {
            const semanticText = `${sample.type} ${JSON.stringify(sample.data)}`;
            try {
                const response = await axios.post(`${NLP_SERVICE_URL}/embed`, { text: semanticText });
                return { ...sample, embedding: response.data.embedding };
            } catch (err) {
                return sample;
            }
        }));

        await Record.insertMany(samplesWithEmbeddings);
        res.json({ message: 'Database seeded successfully', count: samplesWithEmbeddings.length });

    } catch (err) {
        console.error('Seeding error:', err);
        res.status(500).json({ error: 'Seeding failed' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

