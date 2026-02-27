window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    // ONLY SHOW IF ?admin=true IS IN THE URL
    if (urlParams.get('admin') === 'true') {
        const adminBox = document.getElementById('admin-zone');
        if(adminBox) adminBox.style.setProperty("display", "block", "important");
    }

    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        loadMenuFromFile();
    }, 3000);

    document.getElementById('excel-upload').addEventListener('change', (e) => {
        const reader = new FileReader();
        reader.onload = (event) => processExcel(event.target.result);
        reader.readAsArrayBuffer(e.target.files[0]);
    });
};

async function loadMenuFromFile() {
    try {
        const response = await fetch('menu.xlsx');
        if (!response.ok) throw new Error();
        const buffer = await response.arrayBuffer();
        processExcel(buffer);
    } catch (err) {
        document.getElementById('menu-list').innerHTML = "<p style='color:#fff; padding:20px; text-align:center;'>NO MENU LOADED.<br>PLEASE USE ADMIN LINK TO UPLOAD.</p>";
    }
}

function processExcel(buffer) {
    const data = new Uint8Array(buffer);
    const workbook = XLSX.read(data, {type: 'array'});
    const list = document.getElementById('menu-list');
    list.innerHTML = "";

    workbook.SheetNames.forEach((sheetName, sIdx) => {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {header: 1});
        
        // 1. Create the Collapsible Category Button
        const btn = document.createElement('button');
        btn.className = "category-btn";
        btn.innerHTML = `📁 ${sheetName.toUpperCase()}`;
        btn.onclick = () => {
            const content = document.getElementById(`content-${sIdx}`);
            content.style.display = (content.style.display === "block") ? "none" : "block";
        };
        list.appendChild(btn);

        // 2. Create the hidden container
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

            // Identify Section Titles
            if (row[0] && !row[thcIdx] && !row[priceIdx] && row[0] !== "Strain") {
                const head = document.createElement('div');
                head.className = "section-header";
                head.innerText = `> ${row[0]}`;
                contentDiv.appendChild(head);
            }

            // Identify Products
            if (strainIdx > -1 && row[strainIdx] && row[strainIdx] !== "Strain") {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'item-row';
                rowDiv.innerHTML = `
                    <input type="checkbox" class="order-check" value="${row[strainIdx]} (${sheetName})">
                    <div class="item-info">
                        <span style="font-weight:bold;">${row[strainIdx]}</span>
                        <span class="details">THC: ${row[thcIdx] || '??'}% | Price: $${row[priceIdx] || 'TBD'}</span>
                    </div>
                `;
                contentDiv.appendChild(rowDiv);
            }
        });
        list.appendChild(contentDiv);
    });
}

function sendEmail() {
    const selected = document.querySelectorAll('.order-check:checked');
    if (selected.length === 0) { alert("Select some items first!"); return; }
    let body = "New Order Inquiry:%0D%0A%0D%0A";
    selected.forEach(box => { body += "- " + box.value + "%0D%0A"; });
    window.location.href = `mailto:sales@summacannabis.com?subject=ORDER_REQUEST&body=${body}`;
}
