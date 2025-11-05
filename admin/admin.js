// GANTI DENGAN URL & ANON KEY DARI DASHBOARD SUPABASE BARU LO!
const SUPABASE_URL = 'https://ghcaldtlomlfvzyadwog.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY2FsZHRsb21sZnZ6eWFkd29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMzk3NjQsImV4cCI6MjA3NzkxNTc2NH0.13gjKwVzDZalo2ug7RuP4k29cpeUjIpJBZLIwD7MOQA';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Referensi semua Elemen HTML yang kita butuhkan
const loginForm = document.getElementById('login-form');
const adminPanel = document.getElementById('admin-panel');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const addProjectForm = document.getElementById('add-project-form');
const projectList = document.getElementById('project-list');
const adminFilterContainer = document.getElementById('admin-filter-buttons');
const editModal = document.getElementById('edit-modal');
const editProjectForm = document.getElementById('edit-project-form');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const currentProjectImage = document.getElementById('current-project-image');
const addCategorySelect = document.getElementById('add-project-category-select');
const addNewCategoryInput = document.getElementById('add-new-category-input');
const editCategorySelect = document.getElementById('edit-project-category-select');
const editNewCategoryInput = document.getElementById('edit-new-category-input');

// Variabel global untuk menyimpan semua data proyek, biar nggak bolak-balik ke Supabase
let allAdminProjects = [];

// --- FUNGSI HELPER UNTUK DROPDOWN PINTAR ---

// Fungsi untuk mengisi dropdown kategori
function populateCategoryDropdowns(currentCategory = null) {
    // Ambil semua nama kategori yang unik dari data kita, dan saring yang kosong
    const categories = [...new Set(allAdminProjects.map(p => p.category).filter(Boolean))];
    
    const dropdowns = [addCategorySelect, editCategorySelect];
    dropdowns.forEach(dropdown => {
        // Reset isi dropdown, sisakan opsi "Buat Baru"
        dropdown.innerHTML = '<option value="---buat-baru---">--- Buat Kategori Baru ---</option>';
        // Isi dengan kategori yang sudah ada
        categories.forEach(cat => {
            dropdown.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
    });

    // Kalau kita lagi ngedit, otomatis pilih kategori yang sesuai di dropdown edit
    if (currentCategory && editCategorySelect) {
        editCategorySelect.value = currentCategory;
    }
}

// Event listener untuk menampilkan/menyembunyikan input "Kategori Baru"
addCategorySelect.addEventListener('change', () => {
    addNewCategoryInput.style.display = (addCategorySelect.value === '---buat-baru---') ? 'block' : 'none';
});
editCategorySelect.addEventListener('change', () => {
    editNewCategoryInput.style.display = (editCategorySelect.value === '---buat-baru---') ? 'block' : 'none';
});


// --- 1. LOGIKA UTAMA & AUTENTIKASI ---

// Cek status login user saat halaman dimuat
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        loginForm.style.display = 'none';
        adminPanel.style.display = 'block';
        loadInitialAdminData(); // Jika login, langsung muat semua data
    } else {
        loginForm.style.display = 'block';
        adminPanel.style.display = 'none';
    }
});

// Proses Login
loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
});

// Proses Logout
logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
});


// --- 2. LOGIKA MEMUAT, MENAMPILKAN, DAN MEMFILTER DATA ---

// (FUNGSI UTAMA) Muat semua data dari Supabase sekali saja
async function loadInitialAdminData() {
    try {
        const { data: projects, error } = await supabaseClient
            .from('projects').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        
        allAdminProjects = projects;
        populateCategoryDropdowns();
        displayAdminProjects(allAdminProjects);
        createAdminFilterButtons();

    } catch (error) {
        console.error("Gagal memuat data admin:", error);
    }
}

// (FUNGSI TAMPIL) Hanya bertugas menampilkan data yang diberikan kepadanya
function displayAdminProjects(projectsToDisplay) {
    projectList.innerHTML = ''; // Kosongkan daftar
    projectsToDisplay.forEach(project => {
        const projectEl = document.createElement('div');
        projectEl.classList.add('item');
        projectEl.innerHTML = `
            <span>${project.title} (${project.category || 'Tanpa Kategori'})</span>
            <div>
                <button class="edit-btn" data-id="${project.id}">EDIT</button>
                <button class="delete-btn" data-id="${project.id}">HAPUS</button>
            </div>
        `;
        projectList.appendChild(projectEl);
    });
}

// (FUNGSI FILTER) Membuat tombol filter dan logikanya
function createAdminFilterButtons() {
    const categories = ['Semua', ...new Set(allAdminProjects.map(p => p.category || 'Tanpa Kategori').filter(Boolean))];
    adminFilterContainer.innerHTML = '';
    
    categories.forEach(category => {
        const button = document.createElement('button');
        button.classList.add('filter-btn');
        button.textContent = category;
        if (category === 'Semua') button.classList.add('active');

        button.addEventListener('click', () => {
            document.querySelectorAll('#admin-filter-buttons .filter-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            if (category === 'Semua') {
                displayAdminProjects(allAdminProjects);
            } else {
                const filtered = allAdminProjects.filter(p => (p.category || 'Tanpa Kategori') === category);
                displayAdminProjects(filtered);
            }
        });
        adminFilterContainer.appendChild(button);
    });
}


// --- 3. FUNGSI CRUD (CREATE, UPDATE, DELETE) ---

// (CREATE) Tambah Proyek Baru
addProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('project-title').value;
    const imageFile = document.getElementById('project-image').files[0];

    // Logika baru untuk mengambil kategori dari dropdown atau input baru
    let category = addCategorySelect.value;
    if (category === '---buat-baru---') {
        category = addNewCategoryInput.value;
    }

    if (!title || !category || !imageFile) {
        return alert("Judul, Kategori, dan Gambar tidak boleh kosong!");
    }

    try {
        const fileName = `${Date.now()}-${imageFile.name}`;
        await supabaseClient.storage.from('project-images').upload(fileName, imageFile);
        const { data: urlData } = supabaseClient.storage.from('project-images').getPublicUrl(fileName);
        const imageUrl = urlData.publicUrl;

        const { error: insertError } = await supabaseClient.from('projects')
            .insert([{ title, category, image_url: imageUrl }]);
        if (insertError) throw insertError;
        
        addProjectForm.reset();
        addNewCategoryInput.value = '';
        addNewCategoryInput.style.display = 'none';
        alert('Proyek berhasil ditambahkan!');
        loadInitialAdminData(); // Panggil fungsi utama untuk refresh semuanya

    } catch (error) {
        alert(error.message);
    }
});

// Event listener untuk tombol EDIT dan HAPUS
projectList.addEventListener('click', async (e) => {
    const target = e.target;
    
    // (DELETE)
    if (target.classList.contains('delete-btn')) {
        const id = target.dataset.id;
        if (!confirm(`Yakin mau hapus proyek dengan ID: ${id}?`)) return;
        try {
            const { data: project } = await supabaseClient.from('projects').select('image_url').eq('id', id).single();
            await supabaseClient.from('projects').delete().eq('id', id);
            if(project && project.image_url) {
                const imagePath = project.image_url.split('/').pop();
                await supabaseClient.storage.from('project-images').remove([imagePath]);
            }
            alert('Proyek berhasil dihapus!');
            loadInitialAdminData(); // Refresh semuanya
        } catch (error) {
            alert(error.message);
        }
    }

    // (EDIT - Membuka Modal)
    if (target.classList.contains('edit-btn')) {
        const id = target.dataset.id;
        const { data: project, error } = await supabaseClient.from('projects').select('*').eq('id', id).single();
        if (error) { alert(error.message); return; }

        document.getElementById('edit-project-id').value = project.id;
        document.getElementById('edit-project-title').value = project.title;
        populateCategoryDropdowns(project.category); // Isi dropdown & pilih kategori yang sesuai
        currentProjectImage.src = project.image_url;
        editNewCategoryInput.style.display = 'none';
        
        editModal.style.display = 'flex';
    }
});

// (UPDATE) Simpan Perubahan dari form edit
editProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-project-id').value;
    const title = document.getElementById('edit-project-title').value;
    
    // Logika baru untuk mengambil kategori
    let category = editCategorySelect.value;
    if (category === '---buat-baru---') {
        category = editNewCategoryInput.value;
    }

    const imageFile = document.getElementById('edit-project-image').files[0];
    let imageUrl = currentProjectImage.src;

    if (!title || !category) {
        return alert("Judul dan Kategori tidak boleh kosong!");
    }

    try {
        if (imageFile) { // Jika ada gambar baru yang diupload
            const fileName = `${Date.now()}-${imageFile.name}`;
            await supabaseClient.storage.from('project-images').upload(fileName, imageFile);
            const { data: urlData } = supabaseClient.storage.from('project-images').getPublicUrl(fileName);
            imageUrl = urlData.publicUrl;
            // Hapus gambar lama
            const oldImagePath = currentProjectImage.src.split('/').pop();
            await supabaseClient.storage.from('project-images').remove([oldImagePath]);
        }
        
        // Update data di database
        const { error: updateError } = await supabaseClient.from('projects')
            .update({ title, category, image_url: imageUrl }).eq('id', id);
        if (updateError) throw updateError;
        
        alert('Proyek berhasil diupdate!');
        editModal.style.display = 'none';
        loadInitialAdminData(); // Refresh semuanya

    } catch (error) {
        alert(error.message);
    }
});

// Tombol untuk batal edit
cancelEditBtn.addEventListener('click', () => {
    editProjectForm.reset();
    editModal.style.display = 'none';
});