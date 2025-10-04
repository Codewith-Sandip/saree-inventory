const api = (path, opts={}) => fetch('/api'+path, opts).then(r=>r.json());

const form = document.getElementById('sareeForm');
const brand = document.getElementById('brand');
const costPrice = document.getElementById('costPrice');
const sellingPrice = document.getElementById('sellingPrice');
const gstPercent = document.getElementById('gstPercent');
const computed = document.getElementById('computed');
const listEl = document.getElementById('list');
const searchInput = document.getElementById('search');
const sareeIdInput = document.getElementById('sareeId');

function computeFields() {
  const cost = parseFloat(costPrice.value||0);
  const sell = parseFloat(sellingPrice.value||0);
  const gst = parseFloat(gstPercent.value||0);
  const profit = (sell - cost).toFixed(2);
  const gstAmount = (sell * gst / 100).toFixed(2);
  computed.innerText = `Profit per saree: ₹${profit} | GST on selling price: ₹${gstAmount}`;
}

costPrice.addEventListener('input', computeFields);
sellingPrice.addEventListener('input', computeFields);
gstPercent.addEventListener('input', computeFields);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    brand: brand.value.trim(),
    costPrice: parseFloat(costPrice.value),
    sellingPrice: parseFloat(sellingPrice.value),
    gstPercent: parseFloat(gstPercent.value)
  };
  const id = sareeIdInput.value;
  try {
    if (id) {
      const res = await api(`/sarees/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    } else {
      const res = await api('/sarees', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    }
    resetForm();
    loadList();
  } catch (err) {
    alert('Error saving');
    console.error(err);
  }
});

document.getElementById('resetBtn').addEventListener('click', resetForm);

async function loadList(q='') {
  const url = q ? `/sarees?search=${encodeURIComponent(q)}` : '/sarees';
  const res = await fetch('/api'+url);
  const data = await res.json();
  listEl.innerHTML = '';
  if (!data.length) listEl.innerHTML = '<p>No items found.</p>';
  data.forEach(s => {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `<div>
      <strong>${s.brand}</strong>
      <small>Cost: ₹${Number(s.costPrice).toFixed(2)} • Sell: ₹${Number(s.sellingPrice).toFixed(2)} • GST: ${Number(s.gstPercent).toFixed(2)}%</small>
    </div>
    <div class="actions">
      <button onclick="editItem('${s._id}')">Edit</button>
      <button onclick="deleteItem('${s._id}')">Delete</button>
      <button onclick="copyId('${s._id}')">Copy ID</button>
    </div>`;
    listEl.appendChild(div);
  });
}

window.editItem = async (id) => {
  const res = await api(`/sarees/${id}`);
  document.getElementById('brand').value = res.brand;
  document.getElementById('costPrice').value = res.costPrice;
  document.getElementById('sellingPrice').value = res.sellingPrice;
  document.getElementById('gstPercent').value = res.gstPercent;
  document.getElementById('sareeId').value = res._id;
  computeFields();
};

window.deleteItem = async (id) => {
  if (!confirm('Delete this saree?')) return;
  await fetch('/api/sarees/'+id, { method: 'DELETE' });
  loadList();
};

window.copyId = (id) => {
  navigator.clipboard.writeText(id);
  alert('ID copied to clipboard');
};

document.getElementById('btnSearch').addEventListener('click', () => {
  loadList(searchInput.value.trim());
});
document.getElementById('btnRefresh').addEventListener('click', () => { searchInput.value=''; loadList(); });

// Generate PDF
document.getElementById('btnGenerate').addEventListener('click', async () => {
  const sareeId = document.getElementById('billSareeId').value.trim();
  const qty = parseInt(document.getElementById('billQty').value) || 1;
  const customerName = document.getElementById('customerName').value || 'Customer';
  if (!sareeId) return alert('Enter saree id (copy from list)');
  try {
    const res = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ sareeId, quantity: qty, customerName })
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice.pdf';
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert('Failed to generate PDF');
    console.error(e);
  }
});

function resetForm(){
  form.reset();
  sareeIdInput.value='';
  computed.innerText='';
}

// initial load
loadList();
