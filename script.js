window.onload = () => {
    // 1. Secret Admin Check
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
        const adminBox = document.getElementById('admin-zone');
        adminBox.style.setProperty("display", "block", "important");
    }

    // 2. Load Screen Timer
    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        loadMenuFromFile();
    }, 3000);

    document.getElementById('excel-upload').addEventListener('change', handleUpload);
};

async function loadMenuFromFile() {
    try {
        const response = await fetch('menu.xlsx');
        if (!response.ok) throw new Error();
        const buffer = await response.arrayBuffer();
        processExcel(buffer);
    } catch (err) {
        document.getElementById('menu-list').innerHTML = "<p style='color:white; padding:20px;'>UPLOAD menu.xlsx VIA ADMIN LINK</p>";
    }
}

function handleUpload(e) {
    const reader = new FileReader();
    reader.onload = (event) => processExcel(event.target.result);
    reader.readAsArrayBuffer(e.target.files[0]);
}

function processExcel(buffer) {
    const data = new Uint8Array(buffer);
    const workbook = XLSX.read(data, {type: 'array'});
    const list = document.getElementById('menu-list');
    list.innerHTML = "";

    workbook.SheetNames.forEach((sheetName, sIdx) => {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {header: 1});
        
        // Create Main Category Button
        const btn = document.createElement('button');
        btn.className = "category-btn";
        btn.innerHTML = `📁 ${sheetName.toUpperCase()}`;
        btn.onclick = () => toggleCategory(`content-${sIdx}`);
        list.appendChild(btn);

        // Create Container for Content
        const contentDiv = document.createElement('div');
        contentDiv.id = `content-${sIdx}`;
        contentDiv.className = "category-content";

        let strainIdx = -1, thcIdx = -1, priceIdx = -1;

        rows.forEach((row) => {
            if (row.includes("Strain")) {
                strainIdx = row.indexOf("Strain");
                thcIdx = row.findIndex(c => c && c.toString().includes("THC"));
                priceIdx = row.findIndex(c => c && (c.toString().includes("Price") || c.toString().includes("Single")));
                return;
            }

            // Section Headers (Titles like "Chubbies")
            if (row[0] && !row[thcIdx] && !row[priceIdx] && row[0] !== "Strain") {
                const head = document.createElement('div');
                head.className = "section-header";
                head.innerText = `> ${row[0]}`;
                contentDiv.appendChild(head);
                return;
            }

            // Items
            if (strainIdx > -1 && row[strainIdx]) {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'item-row';
                rowDiv.innerHTML = `
                    <input type="checkbox" class="order-check" value="${row[strainIdx]} (${sheetName})">
                    <div class="item-info">
                        <span class="strain">${row[strainIdx]}</span>
                        <span class="details">THC: ${row[thcIdx] || '??'}% | $${row[priceIdx] || 'TBD'}</span>
                    </div>
                `;
                contentDiv.appendChild(rowDiv);
            }
        });
        list.appendChild(contentDiv);
    });
}

function toggleCategory(id) {
    const content = document.getElementById(id);
    const isOpen = content.style.display === "block";
    
    // Close all others first (optional, for a cleaner look)
    document.querySelectorAll('.category-content').forEach(el => el.style.display = "none");
    
    content.style.display = isOpen ? "none" : "block";
}

function sendEmail() {
    const selected = document.querySelectorAll('.order-check:checked');
    if (selected.length === 0) { alert("Select items first!"); return; }
    let body = "Order Inquiry:%0D%0A%0D%0A";
    selected.forEach(box => { body += "- " + box.value + "%0D%0A"; });
    window.location.href = `mailto:sales@summacannabis.com?subject=WHOLESALE_ORDER&body=${body}`;
}
