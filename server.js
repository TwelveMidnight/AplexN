const express = require('express');
const multer = require('multer'); 
const fs = require('fs');
const path = require('path');
const archiver = require('archiver'); // NEW: The Zipping Engine

const app = express();
app.use(express.json()); 

let activeServers = []; 

// Temporarily store uploaded files before zipping
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dest = path.join(__dirname, 'temp_uploads');
        if (!fs.existsSync(dest)) { fs.mkdirSync(dest, { recursive: true }); }
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + path.basename(file.originalname));
    }
});

const uploadParams = multer({ storage: storage }).fields([
    { name: 'resources', maxCount: 1000 }, 
    { name: 'mods', maxCount: 10 }
]);

app.post('/api/servers', uploadParams, async (req, res) => {
    try {
        const serverName = req.body.name || "AplexN_Server";
        const serverIp = req.body.ip;
        
        // Create a safe, web-friendly name for the zip file
        const safeName = serverName.replace(/[^a-zA-Z0-9]/g, '_');
        const zipFileName = `${safeName}_${Date.now()}.zip`;
        const zipFilePath = path.join(__dirname, 'hosted_resources', zipFileName);
        
        // Ensure the hosted folder exists
        if (!fs.existsSync(path.join(__dirname, 'hosted_resources'))) {
            fs.mkdirSync(path.join(__dirname, 'hosted_resources'), { recursive: true });
        }

        // --- THE ZIPPING PROCESS ---
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`Successfully zipped ${archive.pointer()} bytes for ${serverName}`);
            
            // Now that the zip is done, build the server object
            const newServer = {
                name: serverName,
                ip: serverIp,
                description: req.body.description || "Welcome to my Server!",
                allowMods: req.body.allowMods === 'true',
                
                // Provide the direct link to the newly created ZIP file!
                resourceUrl: `/downloads/${zipFileName}`
            };

            activeServers.push(newServer);
            
            // Clean up the loose temporary files to save hard drive space
            if (req.files['resources']) {
                req.files['resources'].forEach(file => fs.unlinkSync(file.path));
            }

            res.json({ success: true, message: "Server Created and Zipped!" });
        });

        archive.pipe(output);

        // Put the uploaded folder files into the Zip
        if (req.files['resources']) {
            req.files['resources'].forEach(file => {
                // Remove the top-level master folder name so it extracts cleanly
                let parts = file.originalname.split('/');
                parts.shift(); 
                let innerPath = parts.join('/');
                
                archive.file(file.path, { name: innerPath });
            });
        }
        
        archive.finalize();

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.get('/api/servers', (req, res) => {
    res.json(activeServers);
});
// This tells Node.js to serve your HTML files!
app.use(express.static(__dirname)); 

// Expose the zipped resources to the C++ Dashboard
app.use('/downloads', express.static(path.join(__dirname, 'hosted_resources')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Master API running on port ${PORT}`));
