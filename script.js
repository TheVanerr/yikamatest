// ============================================================
// ⚠️  FIREBASE CONFIG — Kendi config'inle değiştir!
// console.firebase.google.com → Project settings → Your apps
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyC0XKD1Td_sKUGBF4XvJv412RRslLiZXc8",
  authDomain: "yikamatest-32d67.firebaseapp.com",
  projectId: "yikamatest-32d67",
  storageBucket: "yikamatest-32d67.firebasestorage.app",
  messagingSenderId: "670335999349",
  appId: "1:670335999349:web:984d234f23f6b18328473c"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const COLLECTION = 'yikamatest';

// Application State
let allTests = [];
let currentTestId = null;
let currentBaseTestId = null;
let currentVersion = 'V1';
let isEditing = false;
let deleteTargetId = null;
let _unsubscribe = null;

// Initialize App
function initApp() {
  setupEventListeners();
  updateBreadcrumb('home');
  // Firestore real-time listener
  _unsubscribe = db.collection(COLLECTION)
    .orderBy('created_at', 'desc')
    .onSnapshot(snapshot => {
      allTests = snapshot.docs.map(doc => ({ __backendId: doc.id, ...doc.data() }));
      renderTestList();
      // Count unique base_test_ids
      const uniqueTests = new Set();
      allTests.forEach(test => uniqueTests.add(test.base_test_id || test.id));
      document.getElementById('count-value').textContent = uniqueTests.size;
    }, err => {
      showToast('Firebase bağlantı hatası: ' + err.message, 'error');
      console.error(err);
    });
}

// Toast Notification
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-indigo-500';
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  
  toast.className = `${bgColor} px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 fade-in`;
  toast.innerHTML = `<span class="text-lg">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Render Test List
function renderTestList() {
  const container = document.getElementById('test-list');
  
  if (allTests.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-500 col-span-full">
        <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
        </svg>
        <p class="text-lg">Henüz test kaydedilmemiş</p>
      </div>
    `;
    return;
  }

  // Group tests by base_test_id
  const grouped = {};
  allTests.forEach(test => {
    const baseId = test.base_test_id || test.id;
    if (!grouped[baseId]) {
      grouped[baseId] = [];
    }
    grouped[baseId].push(test);
  });

  // Sort versions within each group
  Object.keys(grouped).forEach(baseId => {
    grouped[baseId].sort((a, b) => {
      const aNum = parseInt(a.version?.replace(/[^\d]/g, '') || '1');
      const bNum = parseInt(b.version?.replace(/[^\d]/g, '') || '1');
      return aNum - bNum;
    });
  });

  // Render grouped tests
  let html = '';
  Object.keys(grouped).forEach(baseId => {
    const versions = grouped[baseId];
    const latestVersion = versions[versions.length - 1];
    
    html += `
      <div class="test-card card-glass rounded-2xl p-6 fade-in hover:shadow-xl transition-all duration-300 border border-white/10 hover:border-indigo-500/30">
        <div class="flex items-start justify-between gap-3 mb-4">
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-bold mb-2 truncate text-white">${latestVersion.test_name}</h3>
            <p class="text-sm text-slate-400 mb-3">${latestVersion.machine_model} • ${latestVersion.company}</p>
            <div class="flex flex-wrap gap-2">
              <span class="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                <svg class="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                ${latestVersion.tank_count} Tank
              </span>
              <span class="text-xs px-3 py-1 rounded-full ${latestVersion.machine_type === 'Tambur' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'} font-medium">
                ${latestVersion.machine_type}
              </span>
              <span class="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-300 font-medium">
                ${latestVersion.test_type}
              </span>
            </div>
          </div>
        </div>
        
        <div class="border-t border-white/10 pt-4 mb-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Versiyonlar</span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium">${versions.length} Versiyon</span>
          </div>
          <div class="space-y-2">
            ${versions.map(v => {
              const isActive = v.__backendId === currentTestId;
              return `
                <button class="version-btn w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-200 border-2 border-green-500/50 shadow-lg' : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-indigo-500/30'}" data-id="${v.__backendId}">
                  <div class="flex items-center justify-between">
                    <span>${v.version || 'V1'}</span>
                    <span class="text-xs opacity-70">${v.test_datetime || ''}</span>
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </div>
        
        <div class="flex gap-2 mt-3">
          <button class="delete-group flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors border border-red-500/20 hover:border-red-500/40" data-base-id="${baseId}">
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            Sil
          </button>
          <button class="export-excel flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors border border-green-500/20 hover:border-green-500/40" data-base-id="${baseId}">
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Excel'e Aktar
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Add click handlers for versions
  container.querySelectorAll('.version-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      loadTest(btn.dataset.id);
    });
  });

  // Add click handlers for delete group
  container.querySelectorAll('.delete-group').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const baseId = btn.dataset.baseId;
      openDeleteModal(baseId);
    });
  });

  // Add click handlers for excel export
  container.querySelectorAll('.export-excel').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const baseId = btn.dataset.baseId;
      exportToExcel(baseId);
    });
  });
}

// Update Breadcrumb Navigation
function updateBreadcrumb(page) {
  const container = document.getElementById('breadcrumb-container');
  const arrow1 = document.getElementById('breadcrumb-arrow-1');
  const breadcrumbSetup = document.getElementById('breadcrumb-setup');
  const arrow2 = document.getElementById('breadcrumb-arrow-2');
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  
  if (page === 'home') {
    // Ana menüde breadcrumb gizli
    container.classList.add('hidden');
  } else if (page === 'setup') {
    // Setup formda: Ana Menü > Test Formu Giriş Bilgileri
    container.classList.remove('hidden');
    arrow1.classList.remove('hidden');
    breadcrumbSetup.classList.remove('hidden');
    arrow2.classList.add('hidden');
    breadcrumbCurrent.classList.add('hidden');
  } else if (page === 'form') {
    // Test formda: Ana Menü > Test Formu Giriş Bilgileri > Test Formu
    container.classList.remove('hidden');
    arrow1.classList.remove('hidden');
    breadcrumbSetup.classList.remove('hidden');
    arrow2.classList.remove('hidden');
    breadcrumbCurrent.classList.remove('hidden');
  }
}

// Open Delete Modal with Version List
function openDeleteModal(baseTestId) {
  const versions = allTests.filter(t => (t.base_test_id || t.id) === baseTestId);
  const testName = versions[0]?.test_name || 'Test';
  
  const modalContent = document.getElementById('delete-modal-content');
  modalContent.innerHTML = `
    <p class="text-slate-300 mb-4">${testName}</p>
    <div class="space-y-2 mb-4 max-h-64 overflow-y-auto">
      ${versions.map(v => `
        <div class="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
          <div class="flex-1">
            <span class="font-medium text-white">${v.version || 'V1'}</span>
            <span class="text-xs text-slate-400 ml-2">${v.test_datetime || ''}</span>
          </div>
          <button class="delete-single-version px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors" data-doc-id="${v.__backendId}">
            Sil
          </button>
        </div>
      `).join('')}
    </div>
  `;
  
  const deleteAllBtn = document.getElementById('btn-delete-all-versions');
  deleteAllBtn.classList.remove('hidden');
  deleteAllBtn.onclick = () => {
    deleteTestGroup(baseTestId);
  };
  
  // Add event listeners for single version delete
  modalContent.querySelectorAll('.delete-single-version').forEach(btn => {
    btn.addEventListener('click', () => {
      const docId = btn.dataset.docId;
      deleteSingleVersion(docId, baseTestId);
    });
  });
  
  document.getElementById('delete-modal').classList.remove('hidden');
  document.getElementById('delete-modal').classList.add('flex');
}

// Close Delete Modal
function closeDeleteModal() {
  document.getElementById('delete-modal').classList.add('hidden');
  document.getElementById('delete-modal').classList.remove('flex');
  document.getElementById('btn-delete-all-versions').classList.add('hidden');
}

// Delete Single Version
async function deleteSingleVersion(docId, baseTestId) {
  try {
    await db.collection(COLLECTION).doc(docId).delete();
    showToast('Versiyon silindi', 'success');
    
    // Check if any versions left
    const remainingVersions = allTests.filter(t => 
      (t.base_test_id || t.id) === baseTestId && t.__backendId !== docId
    );
    
    if (remainingVersions.length === 0) {
      closeDeleteModal();
    } else {
      // Reopen modal with updated list
      setTimeout(() => openDeleteModal(baseTestId), 300);
    }
    
    if (currentTestId === docId) {
      backToTestList();
    }
  } catch (err) {
    showToast('Silme hatası: ' + err.message, 'error');
    console.error(err);
  }
}

// Export to Excel (XLSX format using SheetJS)
function exportToExcel(baseTestId) {
  const versions = allTests.filter(t => (t.base_test_id || t.id) === baseTestId);
  if (versions.length === 0) return;
  
  try {
    const testData = versions[0];
    const wb = XLSX.utils.book_new();
    
    // Create Info Sheet
    const infoData = [
      ['Test Bilgileri'],
      ['Test Adı', testData.test_name],
      ['Firma', testData.company],
      ['Makine Tipi', testData.machine_type],
      ['Makine Modeli', testData.machine_model],
      ['Test Tipi', testData.test_type],
      ['Tank Sayısı', testData.tank_count],
      []
    ];
    const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
    XLSX.utils.book_append_sheet(wb, infoSheet, 'Test Bilgileri');
    
    // Create sheets for each version
    versions.forEach(version => {
      const sheetData = [];
      const sheetName = (version.version || 'V1').substring(0, 31); // Excel sheet name limit
      
      sheetData.push([`${version.version || 'V1'} - ${version.test_datetime || ''}`]);
      sheetData.push([]);
      
      // Parse JSON data
      const tanksData = version.tanks_data ? JSON.parse(version.tanks_data) : [];
      const dryingData = version.drying_data ? JSON.parse(version.drying_data) : null;
      const tamburData = version.tambur_data ? JSON.parse(version.tambur_data) : null;
      const sepetData = version.sepet_data ? JSON.parse(version.sepet_data) : null;
      const kapasiteData = version.kapasite_data ? JSON.parse(version.kapasite_data) : null;
      
      // Tank Data
      if (tanksData && tanksData.length > 0) {
        sheetData.push(['TANK BİLGİLERİ']);
        sheetData.push(['Tank No', 'Kimyasal Adı', 'Sıcaklık (°C)', 'Konsantrasyon (%)', 'Kimyasal (L)', 'Su (L)', 'Süre (dk)', 'İşlem Süresi (dk)']);
        tanksData.forEach((tank, idx) => {
          sheetData.push([
            idx + 1,
            tank.chemicalName || '',
            tank.temp || '',
            tank.concentration || '',
            tank.chemical || '',
            tank.water || '',
            tank.duration || '',
            tank.processTime || ''
          ]);
        });
        sheetData.push([]);
      }
      
      // Drying Data
      if (dryingData) {
        sheetData.push(['KURUTMA BİLGİLERİ']);
        sheetData.push(['Sıcaklık (°C)', dryingData.temp || '']);
        sheetData.push([]);
      }
      
      // Tambur Data
      if (tamburData) {
        sheetData.push(['TAMBUR BİLGİLERİ']);
        sheetData.push(['Frekans (Hz)', tamburData.drumFreq || '']);
        sheetData.push(['Devir (RPM)', tamburData.drumSpeed || '']);
        sheetData.push([]);
      }
      
      // Sepet Data
      if (sepetData) {
        sheetData.push(['SEPET BİLGİLERİ']);
        sheetData.push(['Frekans (Hz)', sepetData.basketFreq || '']);
        sheetData.push(['Devir (RPM)', sepetData.basketSpeed || '']);
        sheetData.push([]);
      }
      
      // Kapasite Data
      if (kapasiteData) {
        sheetData.push(['KAPASİTE BİLGİLERİ']);
        sheetData.push(['Beklenen Miktar', kapasiteData.expected || '']);
        sheetData.push(['Gerçekleşen Miktar', kapasiteData.actual || '']);
        sheetData.push([]);
      }
      
      const versionSheet = XLSX.utils.aoa_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, versionSheet, sheetName);
    });
    
    // Download
    XLSX.writeFile(wb, `${testData.test_name}_${new Date().getTime()}.xlsx`);
    showToast('Excel dosyası indirildi', 'success');
  } catch (err) {
    showToast('Excel oluşturma hatası: ' + err.message, 'error');
    console.error('Excel export error:', err);
  }
}

// Generate Tank Form HTML
function generateTankForm(index, data = {}) {
  const tankNum = index + 1;
  return `
    <div class="tank-card rounded-2xl p-5 fade-in" data-tank="${index}">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold">${tankNum}</div>
        Tank ${tankNum}
      </h3>
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-slate-300 mb-2">Kimyasal Adı</label>
          <input type="text" class="tank-chemical-name input-dark w-full px-4 py-3 rounded-xl text-white" placeholder="Örn: Ariel, Henkel P3..." value="${data.chemicalName || ''}">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Tank Sıcaklığı (°C)</label>
          <input type="number" class="tank-temp input-dark w-full px-4 py-3 rounded-xl text-white" placeholder="60" value="${data.temperature || ''}">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Tank Hacmi (L)</label>
          <input type="number" class="tank-capacity input-dark w-full px-4 py-3 rounded-xl text-white" placeholder="100" value="${data.capacity || ''}">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Kimyasal Oranı (%)</label>
          <input type="number" step="0.1" class="tank-ratio input-dark w-full px-4 py-3 rounded-xl text-white" placeholder="5" value="${data.ratio || ''}">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Su Tipi</label>
          <select class="tank-water input-dark w-full px-4 py-3 rounded-xl text-white">
            <option value="sebeke" ${data.waterType === 'sebeke' ? 'selected' : ''}>Şebeke Suyu</option>
            <option value="aritilmis" ${data.waterType === 'aritilmis' ? 'selected' : ''}>Arıtılmış Su</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Kimyasal Hacmi</label>
          <div class="chemical-result px-4 py-3 rounded-xl chemical-amount font-semibold text-green-400">
            ${data.capacity && data.ratio ? ((data.capacity * data.ratio / 100).toFixed(2) + ' L') : '— L'}
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Su Hacmi</label>
          <div class="chemical-result px-4 py-3 rounded-xl water-amount font-semibold text-blue-400">
            ${data.capacity && data.ratio ? (((data.capacity * (100 - data.ratio)) / 100).toFixed(2) + ' L') : '— L'}
          </div>
        </div>
        <div id="tank-process-time-${index}" class="hidden">
          <label class="block text-sm font-medium text-slate-300 mb-2">Process Süresi (dk)</label>
          <input type="number" class="tank-process-time input-dark w-full px-4 py-3 rounded-xl text-white" placeholder="15" value="${data.processTime || ''}">
        </div>
      </div>
    </div>
  `;
}

// Generate Drying Form HTML
function generateDryingForm(data = {}) {
  return `
    <div class="drying-card rounded-2xl p-5 fade-in">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-orange-500/30 flex items-center justify-center">
          <svg class="w-5 h-5 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>
          </svg>
        </div>
        Kurutma
      </h3>
      <div class="grid md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Kurutma Sıcaklığı (°C)</label>
          <input type="number" id="drying-temp" class="input-dark w-full px-4 py-3 rounded-xl text-white" placeholder="80" value="${data.temperature || ''}">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Kurutma Süresi (dk)</label>
          <input type="number" id="drying-duration" class="input-dark w-full px-4 py-3 rounded-xl text-white" placeholder="30" value="${data.duration || ''}">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Kurutma Tipi</label>
          <select id="drying-type" class="input-dark w-full px-4 py-3 rounded-xl text-white">
            <option value="normal" ${data.type === 'normal' ? 'selected' : ''}>Normal</option>
            <option value="vakum" ${data.type === 'vakum' ? 'selected' : ''}>Vakum</option>
            <option value="hava" ${data.type === 'hava' ? 'selected' : ''}>Hava Üflemeli</option>
          </select>
        </div>
      </div>
    </div>
  `;
}

// Generate Tambur Form HTML
function generateTamburForm(data = {}) {
  return `
    <div class="tank-card rounded-2xl p-5 fade-in" style="border-color: rgba(99, 102, 241, 0.3);">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-indigo-500/30 flex items-center justify-center">
          <svg class="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        Tambur Bilgileri
      </h3>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">İnvertör Frekansı (Hz)</label>
          <input type="number" step="0.1" id="inverter-freq" class="input-dark w-full px-4 py-3 rounded-xl text-white" placeholder="50" value="${data.inverterFreq || ''}">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Tambur Devri (Dev/Dk)</label>
          <input type="number" id="drum-speed" class="input-dark w-full px-4 py-3 rounded-xl text-white" placeholder="30" value="${data.drumSpeed || ''}">
        </div>
      </div>
    </div>
  `;
}

// Generate Sepet Form HTML (for Kabin)
function generateSepetForm(data = {}) {
  return `
    <div class="tank-card rounded-2xl p-5 fade-in" style="border-color: rgba(59, 130, 246, 0.3);">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-blue-500/30 flex items-center justify-center">
          <svg class="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        Sepet Bilgileri
      </h3>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Sepet Frekansı (Hz)</label>
          <input type="number" step="0.1" id="basket-freq" class="input-dark w-full px-4 py-3 rounded-xl text-white" placeholder="50" value="${data.basketFreq || ''}">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Sepet Devri (Dev/Dk)</label>
          <input type="number" id="basket-speed" class="input-dark w-full px-4 py-3 rounded-xl text-white" placeholder="30" value="${data.basketSpeed || ''}">
        </div>
      </div>
    </div>
  `;
}

// Generate Kapasite Form HTML
function generateKapasiteForm(data = {}) {
  return `
    <div class="drying-card rounded-2xl p-5 fade-in" style="border-color: rgba(34, 197, 94, 0.3);">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-green-500/30 flex items-center justify-center">
          <svg class="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        Kapasite Bilgileri
      </h3>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Hedeflenen Parça Sayısı</label>
          <input type="number" id="target-count" class="input-dark w-full px-4 py-3 rounded-xl text-white" placeholder="100" value="${data.targetCount || ''}">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Yıkanan Parça Sayısı</label>
          <input type="number" id="actual-count" class="input-dark w-full px-4 py-3 rounded-xl text-white" placeholder="95" value="${data.actualCount || ''}">
        </div>
      </div>
    </div>
  `;
}

// Calculate Chemical Amount
function calculateChemical(tankElement) {
  const capacity = parseFloat(tankElement.querySelector('.tank-capacity').value) || 0;
  const ratio = parseFloat(tankElement.querySelector('.tank-ratio').value) || 0;
  const chemicalAmount = (capacity * ratio / 100).toFixed(2);
  const waterAmount = ((capacity * (100 - ratio)) / 100).toFixed(2);
  tankElement.querySelector('.chemical-amount').textContent = chemicalAmount > 0 ? `${chemicalAmount} L` : '— L';
  tankElement.querySelector('.water-amount').textContent = waterAmount > 0 ? `${waterAmount} L` : '— L';
}

// Setup Event Listeners
function setupEventListeners() {
  // New Test buttons
  document.getElementById('btn-new-test').addEventListener('click', showSetupForm);
  document.getElementById('btn-start').addEventListener('click', showSetupForm);

  // Setup form buttons
  document.getElementById('btn-generate-form').addEventListener('click', generateMainForm);
  document.getElementById('btn-cancel-setup').addEventListener('click', hideSetupForm);

  // Breadcrumb navigation
  document.getElementById('breadcrumb-home').addEventListener('click', backToTestList);
  document.getElementById('breadcrumb-setup').addEventListener('click', showSetupForm);

  // Save buttons
  document.getElementById('btn-save').addEventListener('click', saveTest);
  document.getElementById('btn-new-version').addEventListener('click', createNewVersion);
  document.getElementById('btn-save-as').addEventListener('click', () => {
    document.getElementById('save-as-name').value = '';
    document.getElementById('save-as-modal').classList.remove('hidden');
    document.getElementById('save-as-modal').classList.add('flex');
  });
  document.getElementById('btn-clear').addEventListener('click', clearForm);

  // Save As Modal
  document.getElementById('btn-cancel-save-as').addEventListener('click', () => {
    document.getElementById('save-as-modal').classList.add('hidden');
    document.getElementById('save-as-modal').classList.remove('flex');
  });
  document.getElementById('btn-confirm-save-as').addEventListener('click', saveAsTest);

  // Delete Modal
  document.getElementById('btn-cancel-delete').addEventListener('click', closeDeleteModal);

  // Chemical calculation listeners (delegated)
  document.getElementById('tanks-container').addEventListener('input', (e) => {
    if (e.target.classList.contains('tank-capacity') || e.target.classList.contains('tank-ratio')) {
      const tankCard = e.target.closest('[data-tank]');
      if (tankCard) calculateChemical(tankCard);
    }
  });
}

// Show/Hide Views
function showSetupForm() {
  document.getElementById('initial-state').classList.add('hidden');
  document.getElementById('test-form').classList.add('hidden');
  document.getElementById('test-list-container').classList.add('hidden');
  document.getElementById('setup-form').classList.remove('hidden');
  currentTestId = null;
  currentBaseTestId = null;
  currentVersion = 'V1';
  isEditing = false;
  document.getElementById('save-btn-text').textContent = 'Kaydet';
  document.getElementById('btn-new-version').classList.add('hidden');
  updateBreadcrumb('setup');
}

function hideSetupForm() {
  document.getElementById('setup-form').classList.add('hidden');
  document.getElementById('test-list-container').classList.remove('hidden');
  updateBreadcrumb('home');
}

function backToTestList() {
  document.getElementById('test-form').classList.add('hidden');
  document.getElementById('setup-form').classList.add('hidden');
  document.getElementById('initial-state').classList.add('hidden');
  document.getElementById('test-list-container').classList.remove('hidden');
  updateBreadcrumb('home');
  showToast('Test listesine dönüldü', 'info');
}

// Generate Main Form
function generateMainForm() {
  const companyName = document.getElementById('company-name').value.trim();
  const machineType = document.getElementById('machine-type').value;
  const machineModel = document.getElementById('machine-model').value.trim();
  const tankCount = parseInt(document.getElementById('tank-count').value);
  const testType = document.getElementById('test-type').value;

  if (!companyName || !machineType || !machineModel || !testType) {
    showToast('Lütfen tüm alanları doldurun', 'error');
    return;
  }

  // Update header
  document.getElementById('form-company').textContent = companyName;
  document.getElementById('form-machine-type').textContent = machineType === 'kabin' ? 'Kabin' : 'Tambur';
  document.getElementById('form-machine').textContent = machineModel;
  document.getElementById('form-tanks').textContent = tankCount;
  document.getElementById('form-test-type').textContent = testType === 'yikama-kalitesi' ? 'Yıkama Kalitesi' : 'Kapasitif';
  
  // Set current datetime
  const now = new Date();
  const dateTimeStr = now.toLocaleString('tr-TR', { 
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
  document.getElementById('form-datetime').textContent = dateTimeStr;
  document.getElementById('form-version').textContent = 'Versiyon: V1';
  currentVersion = 'V1';
  currentBaseTestId = null;

  // Generate tanks
  const tanksContainer = document.getElementById('tanks-container');
  tanksContainer.innerHTML = '';
  for (let i = 0; i < tankCount; i++) {
    tanksContainer.innerHTML += generateTankForm(i);
  }

  // Show/hide process time for Kabin Yıkama Kalitesi
  if (machineType === 'kabin' && testType === 'yikama-kalitesi') {
    for (let i = 0; i < tankCount; i++) {
      const processField = document.getElementById(`tank-process-time-${i}`);
      if (processField) processField.classList.remove('hidden');
    }
  }

  // Generate drying section (always show)
  const dryingContainer = document.getElementById('drying-container');
  dryingContainer.innerHTML = generateDryingForm();
  dryingContainer.classList.remove('hidden');

  // Generate tambur section if Tambur
  const tamburContainer = document.getElementById('tambur-container');
  if (machineType === 'tambur') {
    tamburContainer.innerHTML = generateTamburForm();
    tamburContainer.classList.remove('hidden');
  } else {
    tamburContainer.innerHTML = '';
    tamburContainer.classList.add('hidden');
  }

  // Generate sepet section if Kabin
  const sepetContainer = document.getElementById('sepet-container');
  if (machineType === 'kabin') {
    sepetContainer.innerHTML = generateSepetForm();
    sepetContainer.classList.remove('hidden');
  } else {
    sepetContainer.innerHTML = '';
    sepetContainer.classList.add('hidden');
  }

  // Generate kapasite section if Kapasitif
  const kapasiteContainer = document.getElementById('kapasite-container');
  if (testType === 'kapasitif') {
    kapasiteContainer.innerHTML = generateKapasiteForm();
    kapasiteContainer.classList.remove('hidden');
  } else {
    kapasiteContainer.innerHTML = '';
    kapasiteContainer.classList.add('hidden');
  }

  // Show form
  document.getElementById('setup-form').classList.add('hidden');
  document.getElementById('test-list-container').classList.add('hidden');
  document.getElementById('test-form').classList.remove('hidden');
  updateBreadcrumb('form');
}

// Sidebar Functions
// Collect Form Data
function collectFormData() {
  const tanks = [];
  document.querySelectorAll('[data-tank]').forEach((tank, index) => {
    const processTimeInput = tank.querySelector('.tank-process-time');
    tanks.push({
      chemicalName: tank.querySelector('.tank-chemical-name').value,
      temperature: tank.querySelector('.tank-temp').value,
      capacity: tank.querySelector('.tank-capacity').value,
      ratio: tank.querySelector('.tank-ratio').value,
      waterType: tank.querySelector('.tank-water').value,
      processTime: processTimeInput ? processTimeInput.value : ''
    });
  });

  let drying = null;
  const dryingTemp = document.getElementById('drying-temp');
  if (dryingTemp) {
    drying = {
      temperature: dryingTemp.value,
      duration: document.getElementById('drying-duration').value,
      type: document.getElementById('drying-type').value
    };
  }

  let tambur = null;
  const inverterFreq = document.getElementById('inverter-freq');
  if (inverterFreq) {
    tambur = {
      inverterFreq: inverterFreq.value,
      drumSpeed: document.getElementById('drum-speed').value
    };
  }

  let sepet = null;
  const basketFreq = document.getElementById('basket-freq');
  if (basketFreq) {
    sepet = {
      basketFreq: basketFreq.value,
      basketSpeed: document.getElementById('basket-speed').value
    };
  }

  let kapasite = null;
  const targetCount = document.getElementById('target-count');
  if (targetCount) {
    kapasite = {
      targetCount: targetCount.value,
      actualCount: document.getElementById('actual-count').value
    };
  }

  return { tanks, drying, tambur, sepet, kapasite };
}

// Save Test
async function saveTest() {
  const company = document.getElementById('form-company').textContent;
  const machineType = document.getElementById('form-machine-type').textContent;
  const machine = document.getElementById('form-machine').textContent;
  const tankCount = parseInt(document.getElementById('form-tanks').textContent);
  const testType = document.getElementById('form-test-type').textContent;
  const dateTime = document.getElementById('form-datetime').textContent;
  const notes = document.getElementById('test-notes').value;
  
  const { tanks, drying, tambur, sepet, kapasite } = collectFormData();

  // Generate test name: Company_MachineType_TestType
  const testName = `${company}_${machineType}_${testType}`;

  const testData = {
    id: currentTestId || Date.now().toString(),
    base_test_id: currentBaseTestId || Date.now().toString(),
    test_name: testName,
    company: company,
    machine_type: machineType,
    machine_model: machine,
    tank_count: tankCount,
    test_type: testType,
    version: currentVersion || 'V1',
    test_datetime: dateTime,
    tanks_data: JSON.stringify(tanks),
    drying_data: drying ? JSON.stringify(drying) : '',
    tambur_data: tambur ? JSON.stringify(tambur) : '',
    sepet_data: sepet ? JSON.stringify(sepet) : '',
    kapasite_data: kapasite ? JSON.stringify(kapasite) : '',
    notes: notes,
    updated_at: new Date().toISOString()
  };

  if (allTests.length >= 999 && !isEditing) {
    showToast('Maksimum 999 test kaydedilebilir', 'error');
    return;
  }

  const btn = document.getElementById('btn-save');
  btn.disabled = true;
  btn.innerHTML = '<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

  try {
    if (isEditing && currentTestId) {
      // Update existing version (no version change)
      await db.collection(COLLECTION).doc(currentTestId).update(testData);
      showToast('Test güncellendi!', 'success');
    } else {
      // Create new test as V1
      testData.created_at = new Date().toISOString();
      testData.base_test_id = testData.id;
      currentBaseTestId = testData.base_test_id;
      currentVersion = 'V1';
      const docRef = await db.collection(COLLECTION).add(testData);
      currentTestId = docRef.id;
      isEditing = true;
      
      // Show "New Version" button
      document.getElementById('btn-new-version').classList.remove('hidden');
      
      showToast('Test kaydedildi!', 'success');
    }
  } catch (err) {
    showToast('Kaydetme hatası: ' + err.message, 'error');
    console.error(err);
  }

  btn.disabled = false;
  const btnLabel = isEditing ? 'Güncelle' : 'Kaydet';
  btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg><span id="save-btn-text">' + btnLabel + '</span>';
  renderTestList();
}

// Save As Test
async function saveAsTest() {
  // For new system, save as always creates V1 with new base_test_id
  currentTestId = null;
  currentBaseTestId = null;
  currentVersion = 'V1';
  isEditing = false;
  document.getElementById('form-version').textContent = 'Versiyon: V1';
  document.getElementById('btn-new-version').classList.add('hidden');

  document.getElementById('save-as-modal').classList.add('hidden');
  document.getElementById('save-as-modal').classList.remove('flex');

  await saveTest();
  document.getElementById('save-btn-text').textContent = 'Güncelle';
}

// Create New Version
async function createNewVersion() {
  if (!currentBaseTestId) {
    showToast('Önce mevcut testi kaydedin', 'error');
    return;
  }

  // Get all versions of this test
  const versions = allTests.filter(t => t.base_test_id === currentBaseTestId);
  
  // Find highest version number
  let maxVersion = 0;
  versions.forEach(v => {
    const vNum = parseInt(v.version.replace(/[^\d]/g, ''));
    if (vNum > maxVersion) maxVersion = vNum;
  });
  
  const newVersion = `V${maxVersion + 1}`;
  
  // Collect current form data
  const { tanks, drying, tambur, sepet, kapasite } = collectFormData();
  const company = document.getElementById('form-company').textContent;
  const machineType = document.getElementById('form-machine-type').textContent;
  const machine = document.getElementById('form-machine').textContent;
  const tankCount = parseInt(document.getElementById('form-tanks').textContent);
  const testType = document.getElementById('form-test-type').textContent;
  const notes = document.getElementById('test-notes').value;
  const testName = `${company}_${machineType}_${testType}`;
  
  // Set new datetime
  const now = new Date();
  const dateTimeStr = now.toLocaleString('tr-TR', { 
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });

  // Create new version data
  const newTestData = {
    id: Date.now().toString(),
    base_test_id: currentBaseTestId,
    test_name: testName,
    company: company,
    machine_type: machineType,
    machine_model: machine,
    tank_count: tankCount,
    test_type: testType,
    version: newVersion,
    test_datetime: dateTimeStr,
    tanks_data: JSON.stringify(tanks),
    drying_data: drying ? JSON.stringify(drying) : '',
    tambur_data: tambur ? JSON.stringify(tambur) : '',
    sepet_data: sepet ? JSON.stringify(sepet) : '',
    kapasite_data: kapasite ? JSON.stringify(kapasite) : '',
    notes: notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const btn = document.getElementById('btn-new-version');
  btn.disabled = true;
  btn.innerHTML = '<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

  try {
    const docRef = await db.collection(COLLECTION).add(newTestData);
    
    // Update current state to new version
    currentTestId = docRef.id;
    currentVersion = newVersion;
    
    // Update UI
    document.getElementById('form-version').textContent = 'Versiyon: ' + newVersion;
    document.getElementById('form-datetime').textContent = dateTimeStr;
    document.getElementById('new-version-text').textContent = `V${maxVersion + 2} Oluştur`;
    
    showToast(`${newVersion} oluşturuldu!`, 'success');
  } catch (err) {
    showToast('Hata: ' + err.message, 'error');
    console.error(err);
  }

  btn.disabled = false;
  btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg><span id="new-version-text">V' + (maxVersion + 2) + ' Oluştur</span>';
  
  renderTestList();
}

// Load Test
function loadTest(testId) {
  const test = allTests.find(t => t.__backendId === testId);
  if (!test) return;

  currentTestId = testId;
  currentBaseTestId = test.base_test_id || test.id;
  currentVersion = test.version || 'V1';
  isEditing = true;

  // Update setup form values
  document.getElementById('company-name').value = test.company;
  document.getElementById('machine-type').value = test.machine_type === 'Kabin' ? 'kabin' : 'tambur';
  document.getElementById('machine-model').value = test.machine_model;
  document.getElementById('tank-count').value = test.tank_count;
  document.getElementById('test-type').value = test.test_type === 'Yıkama Kalitesi' || test.test_type === 'yikama-kalitesi' ? 'yikama-kalitesi' : 'kapasitif';

  // Parse saved data
  const tanksData = test.tanks_data ? JSON.parse(test.tanks_data) : [];
  const dryingData = test.drying_data ? JSON.parse(test.drying_data) : null;
  const tamburData = test.tambur_data ? JSON.parse(test.tambur_data) : null;
  const sepetData = test.sepet_data ? JSON.parse(test.sepet_data) : null;
  const kapasiteData = test.kapasite_data ? JSON.parse(test.kapasite_data) : null;

  // Update header
  document.getElementById('form-company').textContent = test.company;
  document.getElementById('form-machine-type').textContent = test.machine_type;
  document.getElementById('form-machine').textContent = test.machine_model;
  document.getElementById('form-tanks').textContent = test.tank_count;
  document.getElementById('form-test-type').textContent = test.test_type;
  document.getElementById('form-version').textContent = 'Versiyon: ' + (test.version || 'V1');
  document.getElementById('form-datetime').textContent = test.test_datetime || '-';
  document.getElementById('test-notes').value = test.notes || '';

  // Show "New Version" button and update its text
  const newVersionBtn = document.getElementById('btn-new-version');
  newVersionBtn.classList.remove('hidden');
  
  // Find all versions of this test and determine next version number
  const allVersions = allTests.filter(t => (t.base_test_id || t.id) === currentBaseTestId);
  let maxVersion = 0;
  allVersions.forEach(v => {
    const vNum = parseInt(v.version?.replace(/[^\d]/g, '') || '1');
    if (vNum > maxVersion) maxVersion = vNum;
  });
  document.getElementById('new-version-text').textContent = `V${maxVersion + 1} Oluştur`;

  // Generate tanks with data
  const tanksContainer = document.getElementById('tanks-container');
  tanksContainer.innerHTML = '';
  const machineType = test.machine_type === 'Kabin' ? 'kabin' : 'tambur';
  const testType = test.test_type === 'Yıkama Kalitesi' ? 'yikama-kalitesi' : 'kapasitif';
  
  for (let i = 0; i < test.tank_count; i++) {
    tanksContainer.innerHTML += generateTankForm(i, tanksData[i] || {});
  }

  // Show process time if needed
  if (machineType === 'kabin' && testType === 'yikama-kalitesi') {
    for (let i = 0; i < test.tank_count; i++) {
      const processField = document.getElementById(`tank-process-time-${i}`);
      if (processField) processField.classList.remove('hidden');
    }
  }

  // Generate drying with data
  const dryingContainer = document.getElementById('drying-container');
  dryingContainer.innerHTML = generateDryingForm(dryingData || {});
  dryingContainer.classList.remove('hidden');

  // Generate tambur with data
  const tamburContainer = document.getElementById('tambur-container');
  if (machineType === 'tambur') {
    tamburContainer.innerHTML = generateTamburForm(tamburData || {});
    tamburContainer.classList.remove('hidden');
  } else {
    tamburContainer.innerHTML = '';
    tamburContainer.classList.add('hidden');
  }

  // Generate sepet with data
  const sepetContainer = document.getElementById('sepet-container');
  if (machineType === 'kabin') {
    sepetContainer.innerHTML = generateSepetForm(sepetData || {});
    sepetContainer.classList.remove('hidden');
  } else {
    sepetContainer.innerHTML = '';
    sepetContainer.classList.add('hidden');
  }

  // Generate kapasite with data
  const kapasiteContainer = document.getElementById('kapasite-container');
  if (testType === 'kapasitif') {
    kapasiteContainer.innerHTML = generateKapasiteForm(kapasiteData || {});
    kapasiteContainer.classList.remove('hidden');
  } else {
    kapasiteContainer.innerHTML = '';
    kapasiteContainer.classList.add('hidden');
  }

  // Show form
  document.getElementById('initial-state').classList.add('hidden');
  document.getElementById('setup-form').classList.add('hidden');
  document.getElementById('test-list-container').classList.add('hidden');
  document.getElementById('test-form').classList.remove('hidden');
  document.getElementById('save-btn-text').textContent = 'Güncelle';
  updateBreadcrumb('form');
  
  // Re-render test list to update active version highlighting
  renderTestList();

  showToast('Test yüklendi', 'success');
}

// Clear Form
function clearForm() {
  document.querySelectorAll('[data-tank] input').forEach(input => input.value = '');
  document.querySelectorAll('[data-tank] select').forEach(select => select.selectedIndex = 0);
  document.querySelectorAll('.chemical-amount').forEach(el => el.textContent = '— L');
  document.querySelectorAll('.water-amount').forEach(el => el.textContent = '— L');
  
  const dryingTemp = document.getElementById('drying-temp');
  if (dryingTemp) {
    dryingTemp.value = '';
    document.getElementById('drying-duration').value = '';
    document.getElementById('drying-type').selectedIndex = 0;
  }

  const inverterFreq = document.getElementById('inverter-freq');
  if (inverterFreq) {
    inverterFreq.value = '';
    document.getElementById('drum-speed').value = '';
  }

  const basketFreq = document.getElementById('basket-freq');
  if (basketFreq) {
    basketFreq.value = '';
    document.getElementById('basket-speed').value = '';
  }

  const targetCount = document.getElementById('target-count');
  if (targetCount) {
    targetCount.value = '';
    document.getElementById('actual-count').value = '';
  }
  
  showToast('Form temizlendi', 'info');
}

// Confirm Delete
async function confirmDelete() {
  if (!deleteTargetId) return;

  const test = allTests.find(t => t.__backendId === deleteTargetId);
  if (!test) return;

  const btn = document.getElementById('btn-confirm-delete');
  btn.disabled = true;
  btn.textContent = 'Siliniyor...';

  try {
    await db.collection(COLLECTION).doc(deleteTargetId).delete();
    if (currentTestId === deleteTargetId) {
      currentTestId = null;
      isEditing = false;
      document.getElementById('test-form').classList.add('hidden');
      document.getElementById('initial-state').classList.remove('hidden');
    }
    showToast('Test silindi', 'success');
  } catch (err) {
    showToast('Silme hatası: ' + err.message, 'error');
    console.error(err);
  }

  btn.disabled = false;
  btn.textContent = 'Sil';
  document.getElementById('delete-modal').classList.add('hidden');
  document.getElementById('delete-modal').classList.remove('flex');
  deleteTargetId = null;
}

// Delete Test Group (all versions)
async function deleteTestGroup(baseTestId) {
  const versions = allTests.filter(t => (t.base_test_id || t.id) === baseTestId);
  if (versions.length === 0) return;

  try {
    // Delete all versions
    const deletePromises = versions.map(v => 
      db.collection(COLLECTION).doc(v.__backendId).delete()
    );
    await Promise.all(deletePromises);

    // If current test is one of deleted versions, reset state
    const deletedIds = versions.map(v => v.__backendId);
    if (deletedIds.includes(currentTestId)) {
      currentTestId = null;
      currentBaseTestId = null;
      currentVersion = 'V1';
      isEditing = false;
      document.getElementById('test-form').classList.add('hidden');
      document.getElementById('initial-state').classList.remove('hidden');
    }

    showToast(`${versions.length} versiyon silindi`, 'success');
    closeDeleteModal();
  } catch (err) {
    showToast('Silme hatası: ' + err.message, 'error');
    console.error(err);
  }
}

// Initialize
initApp();
