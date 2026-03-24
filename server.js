const express = require('express');
const multer = require('multer'); 
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json()); 

// 1. THE MASTER SERVER LIST (Holds the data in memory)
let activeServers = []; 

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dest = path.join(__dirname, 'hosted_resources');
        if (!fs.existsSync(dest)) { fs.mkdirSync(dest, { recursive: true }); }
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const uploadParams = multer({ storage: storage }).fields([
    { name: 'resources', maxCount: 500 }, 
    { name: 'mods', maxCount: 10 }
]);

// 2. THE POST ROUTE (Catches the HTML form)
app.post('/api/servers', uploadParams, (req, res) => {
    try {
        // Build the server object from the HTML form
        const newServer = {
            name: req.body.name || "AplexN Default Server",
            ip: req.body.ip,
            description: req.body.description || "Welcome to my Server!",
            allowMods: req.body.allowMods === 'true',
            
            // We are leaving these blank for a specific reason (explained below)
            client: "", 
            server: "",
            temp: "",
            packages: ""
        };

        // SAVE IT TO THE MASTER LIST!
        activeServers.push(newServer);
        console.log(`Successfully added! Total Servers Online: ${activeServers.length}`);

        res.json({ success: true, message: "Server Created!" });

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// 3. THE GET ROUTE (The C++ Dashboard reads this!)
app.get('/api/servers', (req, res) => {
    // Send the active server list back to the Dashboard
    res.json(activeServers);
});

// 4. File Hosting Route
app.use('/downloads', express.static(path.join(__dirname, 'hosted_resources')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Master API running on port ${PORT}`));
