document.addEventListener('DOMContentLoaded', () => {
  // Initialize admin view
  loadAdminProjects();

  // Form submit handler (handles both Add and Update)
  const form = document.getElementById('admin-project-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  // Cancel edit button handler
  const cancelBtn = document.getElementById('cancel-edit-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', cancelEditing);
  }

  // Export JSON button handler
  const exportBtn = document.getElementById('export-json-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportProjectsJson);
  }

  // Image source type toggle logic
  setupImageToggle();
});

let editingProjectId = null;

/**
 * Load projects from localStorage (or fetch from projects.json if empty) and render table
 */
function loadAdminProjects() {
  const tableBody = document.getElementById('admin-projects-body');
  if (!tableBody) return;

  const localProjects = localStorage.getItem('algox_projects');

  if (localProjects) {
    renderAdminTable(JSON.parse(localProjects));
  } else {
    fetch('projects.json')
      .then(res => res.json())
      .then(data => {
        localStorage.setItem('algox_projects', JSON.stringify(data));
        renderAdminTable(data);
      })
      .catch(err => {
        console.error('Error fetching seed projects for admin:', err);
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Failed to load projects.</td></tr>`;
      });
  }
}

/**
 * Render list of projects in the admin table
 */
function renderAdminTable(projects) {
  const tableBody = document.getElementById('admin-projects-body');
  if (!tableBody) return;

  if (projects.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-4 text-muted">
          No projects available. Add a new project using the form above.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = '';

  projects.forEach((proj, index) => {
    // Determine image preview
    const isBase64 = proj.image.startsWith('data:');
    const imageDisplay = isBase64 
      ? `<span class="badge bg-success">Uploaded File</span>` 
      : `<code class="text-info">${escapeHtml(proj.image)}</code>`;

    tableBody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <img src="${proj.image}" alt="Preview" style="width: 50px; height: 35px; object-fit: contain; background: #080c14; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;" onerror="this.src='https://placehold.co/50x35/0b0f19/f3f4f6?text=X'">
            <strong>${escapeHtml(proj.title)}</strong>
          </div>
        </td>
        <td><span class="badge bg-secondary">${escapeHtml(proj.domain)}</span></td>
        <td>${imageDisplay}</td>
        <td>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary" onclick="editProject(${proj.id})">
              <i class="fa-solid fa-pen"></i> Edit
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteProject(${proj.id})">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  });
}

/**
 * Toggles form fields depending on selected image input method
 */
function setupImageToggle() {
  const radioPath = document.getElementById('img-source-path');
  const radioFile = document.getElementById('img-source-file');
  const containerPath = document.getElementById('path-input-container');
  const containerFile = document.getElementById('file-input-container');

  if (!radioPath || !radioFile) return;

  const toggle = () => {
    if (radioPath.checked) {
      containerPath.classList.remove('d-none');
      containerFile.classList.add('d-none');
      document.getElementById('project-image-file').required = false;
      document.getElementById('project-image-path').required = true;
    } else {
      containerPath.classList.add('d-none');
      containerFile.classList.remove('d-none');
      document.getElementById('project-image-path').required = false;
      // If we are editing, file isn't strictly required (since we keep old image)
      document.getElementById('project-image-file').required = !editingProjectId;
    }
  };

  radioPath.addEventListener('change', toggle);
  radioFile.addEventListener('change', toggle);
}

/**
 * Handles adding and updating projects
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('project-title').value.trim();
  const domain = document.getElementById('project-domain').value;
  const description = document.getElementById('project-desc').value.trim();
  
  const radioPath = document.getElementById('img-source-path');
  const imagePathInput = document.getElementById('project-image-path').value.trim();
  const imageFileInput = document.getElementById('project-image-file');

  let imageUrl = '';

  // Get image value based on selected method
  if (radioPath.checked) {
    imageUrl = imagePathInput || 'uploads/placeholder.jpg';
  } else {
    if (imageFileInput.files && imageFileInput.files[0]) {
      try {
        imageUrl = await convertFileToBase64(imageFileInput.files[0]);
      } catch (err) {
        alert("Error reading file. Falling back to placeholder.");
        imageUrl = 'uploads/placeholder.jpg';
      }
    } else if (editingProjectId) {
      // Keep old image on edit if no new file is uploaded
      const projects = JSON.parse(localStorage.getItem('algox_projects') || '[]');
      const oldProj = projects.find(p => p.id === editingProjectId);
      imageUrl = oldProj ? oldProj.image : 'uploads/placeholder.jpg';
    } else {
      alert("Please upload a file.");
      return;
    }
  }

  const projects = JSON.parse(localStorage.getItem('algox_projects') || '[]');

  if (editingProjectId) {
    // Update Mode
    const index = projects.findIndex(p => p.id === editingProjectId);
    if (index !== -1) {
      projects[index] = {
        id: editingProjectId,
        title,
        domain,
        description,
        image: imageUrl
      };
      alert("Project updated successfully!");
    }
  } else {
    // Add Mode
    const newId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1;
    projects.push({
      id: newId,
      title,
      domain,
      description,
      image: imageUrl
    });
    alert("Project added successfully!");
  }

  // Save changes
  localStorage.setItem('algox_projects', JSON.stringify(projects));
  
  // Reset UI
  cancelEditing();
  loadAdminProjects();
}

/**
 * Loads project details into editing form fields
 */
window.editProject = function(id) {
  const projects = JSON.parse(localStorage.getItem('algox_projects') || '[]');
  const proj = projects.find(p => p.id === id);

  if (!proj) return;

  editingProjectId = id;
  
  document.getElementById('form-title').innerText = "Edit Portfolio Project";
  document.getElementById('submit-btn-text').innerText = "Update Project";
  document.getElementById('cancel-edit-btn').classList.remove('d-none');

  // Fill text values
  document.getElementById('project-title').value = proj.title;
  document.getElementById('project-domain').value = proj.domain;
  document.getElementById('project-desc').value = proj.description;

  // Toggle image inputs based on format
  const isBase64 = proj.image.startsWith('data:');
  const radioPath = document.getElementById('img-source-path');
  const radioFile = document.getElementById('img-source-file');
  const pathInput = document.getElementById('project-image-path');
  
  if (isBase64) {
    radioFile.checked = true;
    radioFile.dispatchEvent(new Event('change'));
    // Clear file required because we keep old one if none selected
    document.getElementById('project-image-file').required = false;
  } else {
    radioPath.checked = true;
    radioPath.dispatchEvent(new Event('change'));
    pathInput.value = proj.image;
  }

  // Scroll to form smoothly
  document.getElementById('admin-project-form').scrollIntoView({ behavior: 'smooth' });
};

/**
 * Deletes a project from active storage list
 */
window.deleteProject = function(id) {
  if (!confirm("Are you sure you want to delete this project? This change is saved in your local browser state.")) {
    return;
  }

  let projects = JSON.parse(localStorage.getItem('algox_projects') || '[]');
  projects = projects.filter(p => p.id !== id);

  localStorage.setItem('algox_projects', JSON.stringify(projects));
  
  if (editingProjectId === id) {
    cancelEditing();
  }

  loadAdminProjects();
};

/**
 * Resets editing form back to adding mode
 */
function cancelEditing() {
  editingProjectId = null;
  document.getElementById('form-title').innerText = "Add New Project";
  document.getElementById('submit-btn-text').innerText = "Add Project";
  document.getElementById('cancel-edit-btn').classList.add('d-none');
  
  // Clear inputs
  document.getElementById('admin-project-form').reset();
  
  // Reset validation state
  const radioPath = document.getElementById('img-source-path');
  if (radioPath) {
    radioPath.checked = true;
    radioPath.dispatchEvent(new Event('change'));
  }
}

/**
 * Export JSON array as projects.json download
 */
function exportProjectsJson() {
  const localProjects = localStorage.getItem('algox_projects');
  
  if (!localProjects) {
    alert("No project list to export.");
    return;
  }

  // Parse and re-format nicely for file outputs
  const data = JSON.parse(localProjects);
  
  // Clean Base64 urls to relative path suggestions on export if desired, or keep as is
  // We keep it as is, but advise users to use paths for final Vercel commits
  const formattedJson = JSON.stringify(data, null, 2);
  
  const blob = new Blob([formattedJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const tempLink = document.createElement('a');
  tempLink.href = url;
  tempLink.download = 'projects.json';
  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);
  URL.revokeObjectURL(url);
  
  // Show instructions modal/alert
  alert("Success! 'projects.json' has been downloaded.\n\nInstructions to Deploy on Vercel:\n1. Copy 'projects.json' into your local project root folder.\n2. Add any corresponding custom image files inside your 'uploads/' folder.\n3. Commit both to Git and push to update the live Vercel site!");
}

/**
 * Helper to read uploaded file to Base64 data string
 */
function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

/**
 * Helper to escape HTML values
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
