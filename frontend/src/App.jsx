import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Loader2, Database, Building2, ShoppingCart, User, Mic, Download } from 'lucide-react';

const API_BASE = 'http://localhost:5001/api';

const Logo = () => (
    <svg width="40" height="60" viewBox="0 0 40 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="brand-logo">
        {/* Outer Capsule - Structure (Unchanged) */}
        <rect x="4" y="2" width="32" height="56" rx="8" stroke="url(#paint0_linear)" strokeWidth="2" fill="rgba(30, 41, 59, 0.5)" />

        {/* Interior: "AI Spark" + "Data Storage" (Clean & Modern) */}

        {/* Top: AI Sparkle (The "Natural Lang" part) */}
        <path d="M20 10L22.5 16.5L29 19L22.5 21.5L20 28L17.5 21.5L11 19L17.5 16.5L20 10Z" fill="#A855F7" />

        {/* Bottom: Database Lines (The "Database" part) */}
        <path d="M12 34H28" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 40H28" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 46H28" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />

        <defs>
            <linearGradient id="paint0_linear" x1="4" y1="2" x2="36" y2="58" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366F1" />
                <stop offset="1" stopColor="#EC4899" />
            </linearGradient>
        </defs>
    </svg>
);

function App() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [method, setMethod] = useState('');
    const [generatedMql, setGeneratedMql] = useState(null); // New State
    const [status, setStatus] = useState('');
    const [filter, setFilter] = useState('all');
    const [categories, setCategories] = useState([]);
    const [history, setHistory] = useState(() => {
        try {
            const saved = localStorage.getItem('search_history');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse history:", e);
            return [];
        }
    });
    const [suggestion, setSuggestion] = useState('');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [dbUri, setDbUri] = useState('');

    useEffect(() => {
        localStorage.setItem('search_history', JSON.stringify(history));
    }, [history]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_BASE}/categories`);
            setCategories(response.data.categories);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const handleSearch = async (e, forcedQuery) => {
        if (e) e.preventDefault();
        const activeQuery = forcedQuery !== undefined ? forcedQuery : query;
        if (!activeQuery.trim()) return;
        if (forcedQuery !== undefined) setQuery(forcedQuery);

        setLoading(true);
        setStatus('');
        setMethod('');
        setSuggestion('');

        try {
            const response = await axios.post(`${API_BASE}/search`, { text: activeQuery });
            setResults(response.data.results);
            setMethod(response.data.method);
            setGeneratedMql(response.data.generatedMql); // Capture MQL
            setSuggestion(response.data.suggestion);

            if (!history.includes(activeQuery)) {
                setHistory(prev => [activeQuery, ...prev].slice(0, 5));
            }
        } catch (err) {
            console.error(err);
            setStatus('Search failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const startVoiceSearch = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Voice search is not supported in this browser.');
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            setQuery(text);
            handleSearch(null, text);
        };

        recognition.start();
    };

    const exportToCSV = () => {
        if (results.length === 0) return;

        const headers = ['Type', 'Name/ID', 'Department', 'City', 'Status', 'Amount/Salary', 'Details'];
        const rows = results.map(r => [
            r.type,
            r.name || r.orderId,
            r.department || '-',
            r.city || '-',
            r.status || '-',
            r.salary || r.amount || '-',
            r.bio || r.description || r.preference || '-'
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "search_results.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getIcon = (type) => {
        const t = (type || '').toLowerCase();
        if (t.includes('employee')) return <User className="w-5 h-5" />;
        if (t.includes('order')) return <ShoppingCart className="w-5 h-5" />;
        if (t.includes('customer')) return <Building2 className="w-5 h-5" />;
        return <Database className="w-5 h-5" />;
    };

    const formatData = (data) => {
        const values = [];
        if (data.department) values.push(data.department);
        if (data.city) values.push(data.city);
        if (data.status) values.push(data.status);
        if (data.amount) values.push(`₹${data.amount.toLocaleString()}`);
        if (data.salary) values.push(`$${data.salary.toLocaleString()}`);
        if (data.email) values.push(data.email);
        return values.join(' | ') || 'No additional data';
    };

    const filteredResults = filter === 'all'
        ? results
        : results.filter(r => (r.type || '').toLowerCase() === filter.toLowerCase());

    const stats = {
        all: results.length,
        avg: results.length ? (results.reduce((acc, r) => acc + (r.salary || r.amount || 0), 0) / results.length).toFixed(0) : 0
    };

    const handleConnect = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus('Connecting to database...');
        try {
            await axios.post(`${API_BASE}/connect`, { uri: dbUri });
            setStatus('Database connected! Refreshing data...');
            await fetchCategories();
            setShowConnectModal(false);
            setResults([]);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setStatus(`Connection failed: ${err.response?.data?.error || err.message}`);
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            <nav className="top-nav">
                <div className="nav-brand">
                    <Logo />
                    <div className="nav-title-block">
                        <span className="nav-line">Natural Lang</span>
                        <span className="nav-line">Interface for</span>
                        <span className="nav-line">Database (DB)</span>
                    </div>
                </div>
                <div className="nav-actions">
                    <button onClick={() => setShowConnectModal(true)} className="nav-connect-btn">
                        <Database className="w-4 h-4" />
                        <span>Connect DB</span>
                    </button>
                </div>
            </nav>

            <div className={`layout-grid ${!isHistoryOpen ? 'history-closed' : ''}`}>

                {isHistoryOpen && (
                    <aside className="sidebar">
                        <div className="sidebar-section">
                            <div className="sidebar-header">
                                <h3 className="section-title">History</h3>
                                <button onClick={() => setIsHistoryOpen(false)} className="close-btn">×</button>
                            </div>
                            <div className="history-list">
                                {history.map((h, i) => (
                                    <button key={i} onClick={() => handleSearch(null, h)} className="history-btn">
                                        {h}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>
                )}

                <main className="main-content">
                    <header className="page-header">
                        {!isHistoryOpen && (
                            <button onClick={() => setIsHistoryOpen(true)} className="history-toggle-absolute">
                                🕒 History
                            </button>
                        )}
                        <h2 className="hero-title-minimal">INTELLIGENT SEARCH</h2>
                        <p className="hero-subtitle">Ask your database anything in plain English</p>
                    </header>

                    <section className="search-section">
                        <form onSubmit={handleSearch} className="search-bar">
                            <Search className="search-icon-inside" />
                            <input
                                type="text"
                                placeholder="Search employees, orders, or customers..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <button
                                type="button"
                                className={`mic-btn ${isListening ? 'listening' : ''}`}
                                onClick={startVoiceSearch}
                                title="Voice Search"
                            >
                                <Mic className={isListening ? 'animate-pulse text-red-500' : ''} />
                            </button>
                            {loading && <Loader2 className="spinner animate-spin" />}
                        </form>

                        <div className="filter-chips">
                            <button onClick={() => setFilter('all')} className={`chip ${filter === 'all' ? 'active' : ''}`}>All</button>
                            {categories.map(cat => (
                                <button key={cat} onClick={() => setFilter(cat)} className={`chip ${filter === cat ? 'active' : ''}`}>
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {results.length > 0 && (
                            <>
                                <div className="stats-row">
                                    <span className="stat-item">Found: <strong>{stats.all}</strong></span>
                                    <span className="stat-item">Avg Value: <strong>{stats.avg}</strong></span>
                                    <span className="method-chip">{method || 'Semantic Search'}</span>
                                    <button onClick={exportToCSV} className="export-btn">
                                        <Download className="w-4 h-4 mr-1" /> Export CSV
                                    </button>
                                </div>
                                {generatedMql && (
                                    <div className="mql-display">
                                        <span className="mql-label">Generated Query:</span>
                                        <code className="mql-code">{JSON.stringify(generatedMql).replace(/,/g, ', ')}</code>
                                    </div>
                                )}
                            </>
                        )}

                        {status && <div className="status-msg">{status}</div>}
                    </section>

                    <section className="results-section">
                        {filteredResults.map((item, idx) => (
                            <div key={item._id || idx} className="data-card" style={{ '--i': idx }}>
                                <div className="card-header">
                                    <span className={`type-tag tag-${(item.type || 'unknown').toLowerCase()}`}>{item.type}</span>
                                    {getIcon(item.type)}
                                </div>
                                <h2 className="card-title">{item.name || item.orderId || 'Unnamed Record'}</h2>
                                <div className="card-info">{formatData(item)}</div>
                                {(item.bio || item.description || item.preference) && (
                                    <p className="card-description">
                                        "{item.bio || item.description || item.preference}"
                                    </p>
                                )}
                            </div>
                        ))}

                        {!loading && filteredResults.length === 0 && query && (
                            <div className="empty-state">
                                <p>No results found.</p>
                                {suggestion && <p className="suggestion-text">💡 Try: {suggestion}</p>}
                            </div>
                        )}
                    </section>
                </main>
            </div>

            {/* Connect DB Modal */}
            {showConnectModal && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowConnectModal(false) }}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <div className="modal-icon-bg">
                                <Database className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h3>Connect Database</h3>
                            <button onClick={() => setShowConnectModal(false)} className="close-modal-btn">×</button>
                        </div>

                        <p className="modal-desc">
                            Enter your MongoDB Connection URI to switch the data source dynamically.
                        </p>

                        <form onSubmit={handleConnect} className="connect-form">
                            <div className="input-group">
                                <label>Connection String</label>
                                <div className="input-wrapper">
                                    <Database className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="mongodb://localhost:27017/my_db"
                                        value={dbUri}
                                        onChange={e => setDbUri(e.target.value)}
                                        className="modal-input-styled"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="quick-actions">
                                <button type="button" onClick={() => setDbUri('mongodb://localhost:27017/semantic_db')} className="text-link">
                                    Use Local Default
                                </button>
                            </div>

                            <div className="modal-actions-professional">
                                <button type="button" onClick={() => setShowConnectModal(false)} className="btn-cancel-styled">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary-styled" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Connecting...
                                        </>
                                    ) : (
                                        'Connect Database'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
