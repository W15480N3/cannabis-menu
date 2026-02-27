let globalMenuData = {}; // Stores the Excel data

window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
        document.getElementById('admin-zone').style.setAttribute("style", "display: block !important");
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
    }, false);
};

async function loadMenuFromFile() {
    try {
        const response = await fetch('menu.xlsx');
        if (!response.ok) throw new Error();
        const arrayBuffer = await response.arrayBuffer();
        processExcel(arrayBuffer);
    } catch (err) {
        document.getElementById('menu-list').innerHTML = "<p style='text-align:center; padding-top:20px;'>NO DATA LOADED</p>";
    }
}

function processExcel(buffer) {
    const data = new Uint8Array(buffer);
    const workbook = XLSX.read(data, {type: 'array'});
    globalMenuData = {};

    workbook.SheetNames.forEach(sheetName => {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {header: 1});
        let sections = [];
        let currentSection = null;
        let sIdx = -1, tIdx = -1, pIdx = -1;

        rows.forEach((row) => {
            if (row.includes("Strain")) {
                sIdx = row.indexOf("Strain");
                tIdx = row.findIndex(c => c && c.toString().includes("THC"));
                pIdx = row.findIndex(c => c && (c.toString().includes("Price") || c.toString().includes("Single")));
                return;
            }

            // Detect a new title row (Text in col 0, but no data in THC/Price columns)
            if (row[0] && !row[tIdx] && !row[pIdx] && row[0] !== "Strain") {
                if (currentSection) sections.push(currentSection);
                currentSection = { title: row[0], items: [] };
                return;
            }

            if (sIdx > -1 && row[sIdx]) {
                if (!currentSection) currentSection = { title: "General", items: [] };
                currentSection.items.push({ name: row[sIdx], thc: row[tIdx] || "??", price: row[pIdx] || "TBD" });
            }
        });
        if (currentSection) sections.push(currentSection);
        if (sections.length > 0) globalMenuData[sheetName] = sections;
    });
    showFolderList();
}

function showFolderList() {
    const list = document.getElementById('menu-list');
    const backBtn = document.getElementById('back-btn');
    const folderText = document.getElementById('current-folder');
    
    list.innerHTML = "";
    backBtn.style.display = "none";
    folderText.innerText = "ROOT:\\SUMMA";

    Object.keys(globalMenuData).forEach(sheetName => {
        const folder = document.createElement('div');
        folder.className = "folder-icon";
        folder.innerHTML = `<span>${sheetName.toUpperCase()}</span>`;
        folder.onclick = () => showSheetContent(sheetName);
        list.appendChild(folder);
    });
}

function showSheetContent(sheetName) {
    const list = document.getElementById('menu-list');
    const backBtn = document.getElementById('back-btn');
    const folderText = document.getElementById('current-folder');

    list.innerHTML = "";
    backBtn.style.display = "block";
    folderText.innerText = `ROOT:\\SUMMA\\${sheetName.toUpperCase()}`;

    globalMenuData[sheetName].forEach(section => {
        const header = document.createElement('div');
        header.className = "section-header";
        header.innerText = section.title;
        list.appendChild(header);

        section.items.forEach((item, idx) => {
            const row = document.createElement('div');
            row.className = 'item-row';
            row.innerHTML = `
                <input type="checkbox" class="order-check" id="${item.name}-${idx}" value="${item.name} (${sheetName})">
                <label for="${item.name}-${idx}" class="item-info">
                    <span class="strain">${item.name}</span>
                    <span class="details">THC: ${item.thc}% | $${item.price}</span>
                </label>
            `;
            list.appendChild(row);
        });
    });
}

function sendEmail() {
    const selected = document.querySelectorAll('.order-check:checked');
    if (selected.length === 0) { alert("Select items first!"); return; }
    let body = "Order Request:%0D%0A%0D%0A";
    selected.forEach(box => { body += "- " + box.value + "%0D%0A"; });
    window.location.href = `mailto:sales@summacannabis.com?subject=WHOLESALE_ORDER&body=${body}`;
}
