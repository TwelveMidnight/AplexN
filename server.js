const express = require('express');
const fs = require('fs'); 
const app = express();

app.get('/api/news', (req, res) => {
    // Read the exact contents of news.txt
    fs.readFile('news.txt', 'utf8', (err, data) => {
        if (err) {
            return res.send("Offline: Master Server Error");
        }
        
        // Send the raw text exactly as it was typed
        res.type('text/plain');
        res.send(data);
    });
});

app.listen(3000, () => console.log('Aplex Master API running on port 3000'));