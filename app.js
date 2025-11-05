const SUPABASE_URL = 'https://ghcaldtlomlfvzyadwog.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY2FsZHRsb21sZnZ6eWFkd29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMzk3NjQsImV4cCI6MjA3NzkxNTc2NH0.13gjKwVzDZalo2ug7RuP4k29cpeUjIpJBZLIwD7MOQA';

// Inisialisasi koneksi dengan nama yang benar
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const galleryGrid = document.getElementById('gallery-grid-public');

const loadProjects = async () => {
    // Menggunakan variabel koneksi yang benar
    const { data: projects, error } = await supabaseClient
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Gagal mengambil data:", error);
        galleryGrid.innerHTML = '<p style="color: red;">ERROR: GAGAL MEMUAT PROYEK. Cek console untuk detail.</p>';
        return;
    }

    if (projects.length === 0) {
        galleryGrid.innerHTML = '<p>Belum ada proyek yang ditambahkan.</p>';
        return;
    }

    galleryGrid.innerHTML = ''; // Kosongkan galeri
    projects.forEach(project => {
        const item = document.createElement('div');
        item.classList.add('gallery-item');
        item.style.backgroundImage = `url('${project.image_url}')`;
        item.innerHTML = `
            <div class="overlay"><h3>${project.title}</h3></div>
        `;
        galleryGrid.appendChild(item);
    });
};

// Panggil fungsi untuk memuat proyek saat halaman dibuka
loadProjects();