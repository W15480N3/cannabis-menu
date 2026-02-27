window.onload = () => {
    // Secret Admin Check (?admin=true)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
        document.getElementById('admin-zone').style.display = 'block';
    }

    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        loadMenuFromFile();
    }, 3000);

    document.getElementById('excel-upload').addEventListener('change', handleUpload, false);
};

async function loadMenuFromFile() {
    try {
        const response = await fetch('menu.xlsx');
        if (!response.ok) throw new Error("menu.xlsx not found");
        const arrayBuffer = await response.arrayBuffer();
        processExcel(arrayBuffer);
    } catch (err) {
        document.getElementById('menu-list').innerHTML = "<p style='text-align:center; padding:20px; color:white;'>SYSTEM READY. <br>UPLOAD menu.xlsx VIA ADMIN LINK.</p>";
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
    let menuStructure = [];

    workbook.SheetNames.forEach(sheetName => {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {header: 1});
        let sheetData = { name: sheetName, sections: [] };
        let currentSection = { title: "General", items: [] };
        
        let strainIdx = -1, thcIdx = -1, priceIdx = -1;

        rows.forEach((row) => {
            // Check if this row is a Header row
            if (row.includes("Strain")) {
                strainIdx = row.indexOf("Strain");
                thcIdx = row.findIndex(c => c && c.toString().includes("THC"));
                priceIdx = row.findIndex(c => c && (c.toString().includes("Price") || c.toString().includes("Single")));
                return;
            }

            // Identify a "Title" row (Text in col 0, but no price/thc)
            if (row[0] && !row[thcIdx] && !row[priceIdx] && row[0] !== "Strain") {
                if (currentSection.items.length > 0) sheetData.sections.push(currentSection);
                currentSection = { title: row[0], items: [] };
                return;
            }

            // Identify a "Data" row
            if (strainIdx > -1 && row[strainIdx]) {
                currentSection.items.push({
                    name: row[strainIdx],
                    thc: row[thcIdx] || "??",
                    price: row[priceIdx] || "TBD"
                });
            }
        });

        if (currentSection.items.length > 0) sheetData.sections.push(currentSection);
        if (sheetData.sections.length > 0) menuStructure.push(sheetData);
    });
    
    renderNestedMenu(menuStructure);
}

function renderNestedMenu(data) {
    const list = document.getElementById('menu-list');
    list.innerHTML = "";

    data.forEach(sheet => {
        // MAIN CATEGORY (Sheet Name)
        const sheetHeader = document.createElement('div');
        sheetHeader.className = "sheet-tab";
        sheetHeader.innerHTML = `💾 C:\\SUMMA\\${sheet.name.toUpperCase()}`;
        list.appendChild(sheetHeader);

        sheet.sections.forEach(section => {
            // SUB-TITLE (Inside the sheet)
            const sectionTitle = document.createElement('div');
            sectionTitle.className = "section-header";
            sectionTitle.innerHTML = `> ${section.title}`;
            list.appendChild(sectionTitle);

            section.items.forEach((item, index) => {
                const row = document.createElement('div');
                row.className = 'item-row';
                row.innerHTML = `
                    <input type="checkbox" class="order-check" id="${sheet.name}-${section.title}-${index}" value="${item.name} (${sheet.name})">
                    <label for="${sheet.name}-${section.title}-${index}" class="item-info">
                        <span class="strain">${item.name}</span>
                        <span class="details">THC: ${item.thc}% | $${item.price}</span>
                    </label>
                `;
                list.appendChild(row);
            });
        });
    });
}

function sendEmail() {
    const selected = document.querySelectorAll('.order-check:checked');
    if (selected.length === 0) { alert("Select items first!"); return; }
    let body = "New Wholesale Order Request:%0D%0A%0D%0A";
    selected.forEach(box => { body += "- " + box.value + "%0D%0A"; });
    window.location.href = `mailto:sales@summacannabis.com?subject=ORDER_REQUEST.LOG&body=${body}`;
}
