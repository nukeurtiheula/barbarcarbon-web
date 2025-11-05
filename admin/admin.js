// Final final fix version
// GANTI DENGAN URL & ANON KEY DARI DASHBOARD SUPABASE BARU LO!
const SUPABASE_URL = 'https://ghcaldtlomlfvzyadwog.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY2FsZHRsb21sZnZ6eWFkd29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMzk3NjQsImV4cCI6MjA3NzkxNTc2NH0.13gjKwVzDZalo2ug7RuP4k29cpeUjIpJBZLIwD7MOQA';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Referensi Elemen HTML
const loginForm = document.getElementById('login-form');
const adminPanel = document.getElementById('admin-panel');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const addProjectForm = document.getElementById('add-project-form');
const projectList = document.getElementById('project-list');
const editModal = document.getElementById('edit-modal');
const editProjectForm = document.getElementById('edit-project-form');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const currentProjectImage = document.getElementById('current-project-image');

// --- 1. LOGIKA AUTENTIKASI ---
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        loginForm.style.display = 'none';
        adminPanel.style.display = 'block';
        displayProjects();
    } else {
        loginForm.style.display = 'block';
        adminPanel.style.display = 'none';
    }
});
loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
});
logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
});

// --- 2. LOGIKA MANAJEMEN PROYEK (CRUD LENGKAP) ---
const displayProjects = async () => {
    const { data: projects, error } = await supabaseClient
        .from('projects').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    projectList.innerHTML = '';
    projects.forEach(project => {
        const projectEl = document.createElement('div');
        projectEl.classList.add('item');
        projectEl.innerHTML = `
            <span>${project.title}</span>
            <div>
                <button class="edit-btn" data-id="${project.id}">EDIT</button>
                <button class="delete-btn" data-id="${project.id}">HAPUS</button>
            </div>
        `;
        projectList.appendChild(projectEl);
    });
};
// (CREATE) Tambah Proyek Baru
addProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('project-title').value;
    const category = document.getElementById('project-category').value;
    const imageFile = document.getElementById('project-image').files[0];

    if (!title || !category || !imageFile) {
        alert("Judul, Kategori, dan Gambar tidak boleh kosong!");
        return;
    }

    try {
        // Step 1: Upload gambar (sama seperti sebelumnya)
        const fileName = `${Date.now()}-${imageFile.name}`;
        await supabaseClient.storage.from('project-images').upload(fileName, imageFile);

        // Step 2: Dapatkan URL-nya (INI BAGIAN YANG LUPA DITAMBAHKAN)
        const { data: urlData } = supabaseClient.storage.from('project-images').getPublicUrl(fileName);
        const imageUrl = urlData.publicUrl; // <-- Sekarang variabel imageUrl sudah dibuat

        // Step 3: Insert data ke tabel, sekarang variabelnya sudah ada
        const { error: insertError } = await supabaseClient
            .from('projects')
            .insert([{ title: title, category: category, image_url: imageUrl }]); // <-- image_url, bukan imageUrl
        
        if (insertError) {
            throw insertError;
        }

        addProjectForm.reset();
        alert('Proyek berhasil ditambahkan!');
        displayProjects(); // Refresh list

    } catch (error) {
        alert(error.message);
    }
});
projectList.addEventListener('click', async (e) => {
    const target = e.target;
    if (target.classList.contains('delete-btn')) {
        const id = target.dataset.id;
        if (!confirm(`Yakin mau hapus proyek dengan ID: ${id}?`)) return;
        try {
            const { data: project } = await supabaseClient.from('projects').select('image_url').eq('id', id).single();
            await supabaseClient.from('projects').delete().eq('id', id);
            const imagePath = project.image_url.split('/').pop();
            await supabaseClient.storage.from('project-images').remove([imagePath]);
            alert('Proyek berhasil dihapus!');
            displayProjects();
        } catch (error) {
            alert(error.message);
        }
    }
    if (target.classList.contains('edit-btn')) {
        const id = target.dataset.id;
        const { data: project } = await supabaseClient.from('projects').select('*').eq('id', id).single();
        document.getElementById('edit-project-id').value = project.id;
        document.getElementById('edit-project-title').value = project.title;
        document.getElementById('edit-project-category').value = project.category;
        currentProjectImage.src = project.image_url;
        editModal.style.display = 'flex';
    }
});
editProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-project-id').value;
    const title = document.getElementById('edit-project-title').value;
    const category = document.getElementById('edit-project-category').value;
    const imageFile = document.getElementById('edit-project-image').files[0];
    let imageUrl = currentProjectImage.src;
    try {
        if (imageFile) {
            const fileName = `${Date.now()}-${imageFile.name}`;
            await supabaseClient.storage.from('project-images').upload(fileName, imageFile);
            const { data: urlData } = supabaseClient.storage.from('project-images').getPublicUrl(fileName);
            imageUrl = urlData.publicUrl;
            const oldImagePath = currentProjectImage.src.split('/').pop();
            await supabaseClient.storage.from('project-images').remove([oldImagePath]);
        }
        const { error } = await supabaseClient.from('projects').update({ title: title, category: category, image_url: imageUrl }).eq('id', id);
        if (error) throw error;
        alert('Proyek berhasil diupdate!');
        editProjectForm.reset();
        editModal.style.display = 'none';
        displayProjects();
    } catch (error) {
        alert(error.message);
    }
});
cancelEditBtn.addEventListener('click', () => {
    editProjectForm.reset();
    editModal.style.display = 'none';
});
