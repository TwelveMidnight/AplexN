const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // NEW: Tool for handling file uploads

const app = express();

// Configure Multer to save uploaded files into an "uploads" folder
const upload = multer({ dest: 'uploads/' });

app.use(express.json({ limit: '50mb' })); 
app.use(express.static(__dirname));

// --- DATABASES (Stored in memory for now) ---
let activeServers = [];
let unnamedServerCount = 0;

// Fake users so your Admin Panel table isn't empty!
let registeredUsers = [
    { username: "AplexDev", serverIp: "26.14.55.102", registerDate: new Date() },
    { username: "PlayerTwo", serverIp: "N/A", registerDate: new Date() }
];

// --- PUBLIC ROUTES ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/host', (req, res) => res.sendFile(path.join(__dirname, 'host.html')));

app.get('/api/servers', (req, res) => res.json(activeServers));

app.post('/api/servers', (req, res) => {
    let serverData = req.body;
    if (!serverData.description || serverData.description.trim() === "") serverData.description = "Welcome to my Server!";
    if (!serverData.name || serverData.name.trim() === "") {
        unnamedServerCount++;
        serverData.name = `AplexN Server #${unnamedServerCount}`;
    }
    if (!serverData.image) serverData.image = "blueN.jpg";
    
    activeServers.push(serverData);
    res.json({ success: true, message: "Server Created!" });
});

// The endpoint your C++ Launcher reads from
app.get('/api/news', (req, res) => {
    fs.readFile('news.txt', 'utf8', (err, data) => {
        if (err) res.send("Welcome to AplexN Framework!");
        else res.send(data);
    });
});


// --- ADMIN ROUTES ---

// 1. Serve the Admin Page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// 2. Feed the Admin Panel the list of users
app.get('/api/users', (req, res) => {
    res.json(registeredUsers);
});

// 3. Receive the News Form from the Admin Panel
app.post('/api/news/update', upload.single('image'), (req, res) => {
    const title = req.body.title;
    const body = req.body.body;
    const file = req.file; // The uploaded image (if attached)

    // Format the text perfectly for your C++ Launcher
    const formattedNewsText = `[ ${title.toUpperCase()} ]\n\n${body}`;

    // Physically overwrite the news.txt file!
    fs.writeFile('news.txt', formattedNewsText, (err) => {
        if (err) {
            console.log("Error writing news:", err);
            return res.status(500).json({ success: false });
        }
        
        console.log(`[ADMIN] News Updated: ${title}`);
        res.json({ success: true });
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Aplex Master API running on port ${PORT}`);
});