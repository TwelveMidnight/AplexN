const express = require('express');
const multer = require('multer'); // 1. Import Multer
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json()); // Keeps standard JSON working for other routes

// 2. Configure Multer to save uploaded folders into a "hosted_resources" folder
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dest = path.join(__dirname, 'hosted_resources');
        if (!fs.existsSync(dest)) { fs.mkdirSync(dest, { recursive: true }); }
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        // Keep the original file names
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// We tell Multer to look for the "resources" folder and the "mods" files we sent from HTML
const uploadParams = multer({ storage: storage }).fields([
    { name: 'resources', maxCount: 500 }, // Allows up to 500 files inside the folder
    { name: 'mods', maxCount: 10 }
]);

// 3. Apply the Multer middleware to your route!
app.post('/api/servers', uploadParams, (req, res) => {
    
    try {
        // req.body now contains all your text!
        const serverName = req.body.name;
        const serverIp = req.body.ip;
        const serverDesc = req.body.description;
        const allowMods = req.body.allowMods;
        const base64Image = req.body.image; 

        // req.files contains all the uploaded folder files!
        const uploadedResources = req.files['resources'] || [];
        const uploadedMods = req.files['mods'] || [];

        console.log(`Received Server: ${serverName} with ${uploadedResources.length} resource files.`);

        // ==========================================
        // PUT YOUR DATABASE SAVING LOGIC HERE!
        // Save serverName, serverIp, etc., to your DB
        // ==========================================

        // Tell the HTML frontend it was a success
        res.json({ success: true, message: "Server and Resources Uploaded!" });

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// 4. VERY IMPORTANT: You must serve the 'hosted_resources' folder statically
// so your C++ Dashboard can actually download the files later!
app.use('/downloads', express.static(path.join(__dirname, 'hosted_resources')));

// ... the rest of your server.listen code ...
