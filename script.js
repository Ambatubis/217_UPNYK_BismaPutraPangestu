/**
 * script.js — Task List App
 * Fitur: CRUD task, toggle completed/active, filter (All/Active/Completed)
 * Storage: localStorage (data persisten saat halaman di-refresh)
 */

// =============================================
// STATE
// =============================================

/** @type {Array<{id: string, text: string, completed: boolean, createdAt: number}>} */
let tasks = [];

/** Filter aktif saat ini: 'all' | 'active' | 'completed' */
let currentFilter = "all";

/** ID task yang sedang diedit (null jika tidak ada) */
let editingTaskId = null;

// =============================================
// KONSTANTA & REFERENSI ELEMEN
// =============================================

const STORAGE_KEY = "tasklist_tasks";

const taskForm         = document.getElementById("task-form");
const taskInput        = document.getElementById("task-input");
const validationMsg    = document.getElementById("validation-msg");
const taskList         = document.getElementById("task-list");
const emptyState       = document.getElementById("empty-state");
const emptyMsg         = document.getElementById("empty-msg");
const cardFooter       = document.getElementById("card-footer");
const footerCount      = document.getElementById("footer-count");
const clearCompletedBtn = document.getElementById("clear-completed-btn");
const countAll         = document.getElementById("count-all");
const countActive      = document.getElementById("count-active");
const countCompleted   = document.getElementById("count-completed");
const filterBtns       = document.querySelectorAll(".filter-btn");

// Modal edit
const editModal        = document.getElementById("edit-modal");
const modalOverlay     = document.getElementById("modal-overlay");
const editInput        = document.getElementById("edit-input");
const editValidationMsg = document.getElementById("edit-validation-msg");
const cancelEditBtn    = document.getElementById("cancel-edit-btn");
const saveEditBtn      = document.getElementById("save-edit-btn");

// =============================================
// UTILITAS
// =============================================

/**
 * Menghasilkan ID unik sederhana berbasis waktu + random.
 * @returns {string}
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Menyimpan array tasks ke localStorage.
 */
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * Memuat tasks dari localStorage. Jika belum ada, mulai dengan array kosong.
 */
function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    tasks = stored ? JSON.parse(stored) : [];
  } catch {
    tasks = [];
  }
}

/**
 * Escape karakter HTML untuk mencegah XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return str.replace(/[&<>"']/g, (ch) => map[ch]);
}

// =============================================
// FILTERING
// =============================================

/**
 * Mengembalikan array tasks sesuai filter aktif.
 * @returns {Array}
 */
function getFilteredTasks() {
  switch (currentFilter) {
    case "active":    return tasks.filter((t) => !t.completed);
    case "completed": return tasks.filter((t) =>  t.completed);
    default:          return [...tasks];
  }
}

// =============================================
// RENDER
// =============================================

/**
 * Me-render ulang seluruh daftar task ke DOM.
 * Dipanggil setiap kali state berubah.
 */
function render() {
  const filtered = getFilteredTasks();

  // Kosongkan list
  taskList.innerHTML = "";

  // Hitung statistik
  const totalCount     = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const activeCount    = totalCount - completedCount;

  // Update jumlah task pada masing-masing tab filter
  countAll.textContent       = `(${totalCount})`;
  countActive.textContent    = `(${activeCount})`;
  countCompleted.textContent = `(${completedCount})`;

  // Tampilkan / sembunyikan empty state
  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
    emptyMsg.textContent =
      currentFilter === "active"    ? "Tidak ada task aktif." :
      currentFilter === "completed" ? "Belum ada task yang selesai." :
                                      "Belum ada task. Tambahkan sekarang!";
  } else {
    emptyState.classList.add("hidden");
  }

  // Tampilkan / sembunyikan footer card
  if (totalCount > 0) {
    cardFooter.classList.remove("hidden");
    footerCount.textContent = `${activeCount} task tersisa`;
    // Tombol hapus semua selesai hanya muncul jika ada task completed
    clearCompletedBtn.style.visibility = completedCount > 0 ? "visible" : "hidden";
  } else {
    cardFooter.classList.add("hidden");
  }

  // Render setiap task
  filtered.forEach((task) => {
    const li = createTaskElement(task);
    taskList.appendChild(li);
  });
}

/**
 * Membuat elemen <li> untuk satu task.
 * @param {{id: string, text: string, completed: boolean}} task
 * @returns {HTMLLIElement}
 */
function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task-item";
  li.dataset.id = task.id;
  li.setAttribute("role", "listitem");

  li.innerHTML = `
    <!-- Checkbox untuk toggle completed -->
    <input
      type="checkbox"
      class="task-checkbox"
      id="check-${task.id}"
      aria-label="Tandai selesai"
      ${task.completed ? "checked" : ""}
    />

    <!-- Teks task -->
    <label
      for="check-${task.id}"
      class="task-label ${task.completed ? "completed" : ""}"
    >${escapeHtml(task.text)}</label>

    <!-- Tombol aksi: Edit & Hapus -->
    <div class="flex items-center gap-1 ml-auto">
      <!-- Tombol Edit -->
      <button
        class="task-action-btn edit-btn"
        data-action="edit"
        data-id="${task.id}"
        aria-label="Edit task"
        title="Edit"
      >
        <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
        </svg>
      </button>

      <!-- Tombol Hapus -->
      <button
        class="task-action-btn delete-btn"
        data-action="delete"
        data-id="${task.id}"
        aria-label="Hapus task"
        title="Hapus"
      >
        <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    </div>
  `;

  return li;
}

// =============================================
// CRUD OPERATIONS
// =============================================

/**
 * CREATE — Menambahkan task baru ke array dan menyimpannya.
 * @param {string} text
 */
function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const newTask = {
    id:        generateId(),
    text:      trimmed,
    completed: false,
    createdAt: Date.now(),
  };

  tasks.unshift(newTask); // tambahkan di depan agar tampil paling atas
  saveTasks();
  render();

  // Animasikan task pertama di list
  const firstItem = taskList.querySelector(".task-item");
  if (firstItem) {
    firstItem.classList.add("new-item");
    firstItem.addEventListener("animationend", () => firstItem.classList.remove("new-item"), { once: true });
  }
}

/**
 * UPDATE TEXT — Memperbarui teks task berdasarkan ID.
 * @param {string} id
 * @param {string} newText
 */
function updateTaskText(id, newText) {
  const trimmed = newText.trim();
  if (!trimmed) return;

  tasks = tasks.map((t) => (t.id === id ? { ...t, text: trimmed } : t));
  saveTasks();
  render();
}

/**
 * TOGGLE COMPLETED — Membalik status completed task.
 * @param {string} id
 */
function toggleTask(id) {
  tasks = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
  saveTasks();
  render();
}

/**
 * DELETE — Menghapus satu task berdasarkan ID.
 * @param {string} id
 */
function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  render();
}

/**
 * CLEAR COMPLETED — Menghapus semua task yang sudah selesai.
 */
function clearCompleted() {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  render();
}

// =============================================
// MODAL EDIT
// =============================================

/**
 * Membuka modal edit dengan data task yang dipilih.
 * @param {string} id
 */
function openEditModal(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  editingTaskId = id;
  editInput.value = task.text;
  editValidationMsg.classList.add("hidden");

  editModal.classList.remove("hidden");
  editInput.focus();
  editInput.select();
}

/**
 * Menutup modal edit dan mereset state editing.
 */
function closeEditModal() {
  editModal.classList.add("hidden");
  editingTaskId = null;
  editInput.value = "";
}

/**
 * Menyimpan perubahan dari modal edit.
 */
function saveEdit() {
  const newText = editInput.value.trim();
  if (!newText) {
    editValidationMsg.classList.remove("hidden");
    editInput.focus();
    return;
  }
  editValidationMsg.classList.add("hidden");

  if (editingTaskId) {
    updateTaskText(editingTaskId, newText);
  }
  closeEditModal();
}

// =============================================
// EVENT LISTENERS
// =============================================

/** Form tambah task */
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = taskInput.value.trim();

  if (!value) {
    validationMsg.classList.remove("hidden");
    taskInput.focus();
    return;
  }

  validationMsg.classList.add("hidden");
  addTask(value);
  taskInput.value = "";
  taskInput.focus();
});

/** Sembunyikan pesan validasi saat user mulai mengetik */
taskInput.addEventListener("input", () => {
  if (taskInput.value.trim()) {
    validationMsg.classList.add("hidden");
  }
});

/**
 * Event delegation pada <ul> untuk:
 * - Checkbox toggle (completed)
 * - Tombol edit
 * - Tombol delete
 */
taskList.addEventListener("click", (e) => {
  const target = e.target;

  // Toggle completed via checkbox
  if (target.classList.contains("task-checkbox")) {
    const id = target.closest(".task-item")?.dataset.id;
    if (id) toggleTask(id);
    return;
  }

  // Tombol aksi (edit / delete)
  const actionBtn = target.closest("[data-action]");
  if (!actionBtn) return;

  const { action, id } = actionBtn.dataset;

  if (action === "edit")   openEditModal(id);
  if (action === "delete") deleteTask(id);
});

/** Filter buttons */
filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Update state filter
    currentFilter = btn.dataset.filter;

    // Update tampilan tab aktif
    filterBtns.forEach((b) => {
      b.classList.toggle("active-filter", b === btn);
      b.setAttribute("aria-selected", b === btn ? "true" : "false");
    });

    render();
  });
});

/** Tombol hapus semua selesai */
clearCompletedBtn.addEventListener("click", clearCompleted);

// --- Modal events ---
saveEditBtn.addEventListener("click", saveEdit);

cancelEditBtn.addEventListener("click", closeEditModal);

/** Tutup modal saat klik overlay */
modalOverlay.addEventListener("click", closeEditModal);

/** Simpan dengan Enter, tutup dengan Escape di input edit */
editInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter")  saveEdit();
  if (e.key === "Escape") closeEditModal();
});

/** Sembunyikan pesan validasi modal saat mengetik */
editInput.addEventListener("input", () => {
  if (editInput.value.trim()) {
    editValidationMsg.classList.add("hidden");
  }
});

// =============================================
// INISIALISASI
// =============================================

/**
 * Jalankan saat DOM siap:
 * 1. Muat data dari localStorage
 * 2. Render tampilan awal
 */
(function init() {
  loadTasks();
  render();
})();
