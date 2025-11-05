const SUPABASE_URL = 'https://ghcaldtlomlfvzyadwog.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY2FsZHRsb21sZnZ6eWFkd29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMzk3NjQsImV4cCI6MjA3NzkxNTc2NH0.13gjKwVzDZalo2ug7RuP4k29cpeUjIpJBZLIwD7MOQA';

// Inisialisasi koneksi dengan nama yang benar
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const galleryGrid = document.getElementById('gallery-grid-public');
const filterContainer = document.getElementById('filter-buttons');
let allProjects = []; // Variabel untuk menyimpan semua proyek

// --- Fungsi untuk menampilkan proyek ke galeri ---
function displayProjects(projectsToDisplay) {
    galleryGrid.innerHTML = ''; // Selalu kosongkan galeri dulu

    if (projectsToDisplay.length === 0) {
        galleryGrid.innerHTML = '<p style="color: white;">Tidak ada proyek dalam kategori ini.</p>';
        return;
    }

    projectsToDisplay.forEach(project => {
        const item = document.createElement('div');
        item.classList.add('gallery-item');

        const img = document.createElement('img');
        img.src = project.image_url;
        img.alt = project.title;

        const overlay = document.createElement('div');
        overlay.classList.add('overlay');
        overlay.innerHTML = `<h3>${project.title}</h3>`;

        item.appendChild(img);
        item.appendChild(overlay);
        galleryGrid.appendChild(item);
    });
}

// --- Fungsi untuk membuat tombol filter ---
function createFilterButtons() {
    // 1. Dapatkan semua kategori unik dari data proyek
    const categories = ['Semua', ...new Set(allProjects.map(project => project.category))];

    // 2. Buat tombol untuk setiap kategori
    filterContainer.innerHTML = '';
    categories.forEach(category => {
        const button = document.createElement('button');
        button.classList.add('filter-btn');
        button.textContent = category;
        if (category === 'Semua') {
            button.classList.add('active'); // Tombol "Semua" aktif pertama kali
        }

        // 3. Tambahkan event listener untuk setiap tombol
        button.addEventListener('click', () => {
            // Hapus class 'active' dari semua tombol
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            // Tambahkan class 'active' ke tombol yang diklik
            button.classList.add('active');

            if (category === 'Semua') {
                displayProjects(allProjects); // Tampilkan semua proyek
            } else {
                const filteredProjects = allProjects.filter(project => project.category === category);
                displayProjects(filteredProjects); // Tampilkan proyek yang sudah difilter
            }
        });

        filterContainer.appendChild(button);
    });
}


// --- Fungsi utama untuk memuat semua data saat halaman dibuka ---
async function loadInitialData() {
    try {
        const { data: projects, error } = await supabaseClient
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allProjects = projects; // Simpan semua proyek ke variabel global
        displayProjects(allProjects); // Tampilkan semua proyek pertama kali
        createFilterButtons(); // Buat tombol filter berdasarkan data yang ada

    } catch (error) {
        console.error("Gagal memuat data awal:", error);
        galleryGrid.innerHTML = `<p style="color: red;">ERROR: ${error.message}</p>`;
    }
}

// Panggil fungsi utama saat halaman dibuka
loadInitialData();