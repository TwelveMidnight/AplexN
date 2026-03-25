<script>
    let base64Image = null;

    function previewImage(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          document.getElementById('previewImg').src = e.target.result;
          base64Image = e.target.result; 
        }
        reader.readAsDataURL(file);
      }
    }

    async function submitServer() {
      const ip = document.getElementById('serverIp').value;
      if (!ip || ip.trim() === "") {
        alert("You must provide a Server IP Address so players can connect!");
        return;
      }

      const formData = new FormData();
      
      // Notice: We just pass exactly what is in the box. No fallbacks! 
      // If it's blank, the Node.js backend handles the #1, #2 numbering.
      formData.append('name', document.getElementById('serverName').value.trim());
      
      formData.append('ip', ip);
      formData.append('description', document.getElementById('serverDesc').value);
      
      const allowModsEl = document.getElementById('allowClientMods');
      if (allowModsEl) formData.append('allowMods', allowModsEl.checked);
      
      if (base64Image) {
          formData.append('image', base64Image);
      }

      const resourceInput = document.getElementById('resourceFolder');
      if (resourceInput && resourceInput.files.length > 0) {
          for (let i = 0; i < resourceInput.files.length; i++) {
              let file = resourceInput.files[i];
              formData.append('resources', file, file.webkitRelativePath);
          }
      }

      const modsInput = document.getElementById('serverMods');
      if (modsInput && modsInput.files.length > 0) {
          for (let i = 0; i < modsInput.files.length; i++) {
              formData.append('mods', modsInput.files[i]);
          }
      }

      const btn = document.querySelector('button');
      btn.innerText = "Uploading Resources... Please Wait";
      btn.disabled = true;

      try {
        const response = await fetch('/api/servers', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        
        if (data.success) {
          window.location.href = "index.html"; 
        } else {
          alert("Server responded with an error.");
          btn.innerText = "Initialize Server";
          btn.disabled = false;
        }
      } catch(err) {
        alert("Error connecting to Master API or upload failed. Check your Node.js backend.");
        btn.innerText = "Initialize Server";
        btn.disabled = false;
      }
    }
  </script>
