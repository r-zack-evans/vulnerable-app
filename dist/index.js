"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_session_1 = __importDefault(require("express-session"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const typeorm_1 = require("typeorm");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const api_routes_1 = __importDefault(require("./routes/api.routes"));
const vue_api_routes_1 = __importDefault(require("./routes/vue-api.routes"));
// Load environment variables
dotenv_1.default.config();
// Initialize database connection
(0, typeorm_1.createConnection)({
    type: 'sqlite',
    database: 'vuln_app.sqlite',
    entities: [path_1.default.join(__dirname, 'entity/**/*.{js,ts}')],
    synchronize: true, // VULNERABILITY: Automatic schema synchronization in production is a security risk
}).then(() => {
    console.log('Database connected');
}).catch(error => console.log('Database connection error: ', error));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Vue frontend handles all views
// Middleware
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
// Serve Vue app from the vue directory as main application
app.use(express_1.default.static(path_1.default.join(__dirname, 'public/vue')));
// Catch-all route to serve the Vue SPA
app.get(['/app/*', '/login', '/register', '/admin', '/products*'], (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'public/vue/index.html'));
});
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(body_parser_1.default.json());
app.use((0, cookie_parser_1.default)());
// VULNERABILITY: Session secret hardcoded and not secure
app.use((0, express_session_1.default)({
    secret: 'supersecretkey', // VULNERABILITY: Hardcoded secret
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // VULNERABILITY: Insecure cookies in production
        httpOnly: false // VULNERABILITY: Cookies accessible via JavaScript
    }
}));
// VULNERABILITY: No CORS configuration
// VULNERABILITY: No helmet for security headers
// Global variable to track login attempts (VULNERABILITY: Should use a proper rate limiter)
const loginAttempts = {};
global.loginAttempts = loginAttempts;
// Routes
app.use('/auth', auth_routes_1.default);
app.use('/users', user_routes_1.default);
app.use('/products', product_routes_1.default);
app.use('/admin', admin_routes_1.default);
app.use('/api', api_routes_1.default);
app.use('/api/vue', vue_api_routes_1.default);
// Root route - redirect to Vue app
app.get('/', (req, res) => {
    res.redirect('/app');
});
// Legacy route - now redirects to Vue
app.get('/try-vue', (req, res) => {
    res.redirect('/app');
});
// Serve Vue SPA for any non-API routes
app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/auth')) {
        return res.sendFile(path_1.default.join(__dirname, 'public/vue/index.html'));
    }
    next();
});
// VULNERABILITY: Detailed error exposure
app.use((err, req, res, next) => {
    console.error(err.stack);
    // API requests return JSON errors
    if (req.path.startsWith('/api')) {
        // VULNERABILITY: Exposing detailed error information in JSON
        return res.status(500).json({
            error: 'Server Error',
            message: err.message,
            stack: err.stack, // VULNERABILITY: Exposing stack trace
            details: err
        });
    }
    // For all other requests, send the Vue app to handle error display
    res.status(500).sendFile(path_1.default.join(__dirname, 'public/vue/index.html'));
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
