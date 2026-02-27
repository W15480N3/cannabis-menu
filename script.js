window.onload = () => {
    // 3-second loader
    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        loadMenuFromFile();
    }, 3000);
};

async function loadMenuFromFile() {
    try {
        const response = await fetch('menu.xlsx');
        if (!response.ok) throw new Error("File 'menu.xlsx' not found");
        
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, {type: 'array'});
        
        let allItems = [];

        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            // Turn the sheet into an array of arrays (rows and columns)
            const rows = XLSX.utils.sheet_to_json(sheet, {header: 1}); 
            
            let strainIdx = -1, thcIdx = -1, priceIdx = -1;

            // Step 1: Find the Header Row (The one that says "Strain")
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (row.includes("Strain")) {
                    strainIdx = row.indexOf("Strain");
                    // Find THC index (handles "THC%" or "THC %")
                    thcIdx = row.findIndex(cell => cell && cell.toString().includes("THC"));
                    // Find Price index (handles "Price" or "1G Single")
                    priceIdx = row.findIndex(cell => cell && (cell.toString().includes("Price") || cell.toString().includes("Single")));
                    
                    // Step 2: Start collecting data from the row AFTER the header
                    for (let j = i + 1; j < rows.length; j++) {
                        const dataRow = rows[j];
                        if (dataRow[strainIdx] && dataRow[strainIdx] !== "Strain") {
                            allItems.push({
                                strain: dataRow[strainIdx],
                                thc: dataRow[thcIdx] || "??",
                                price: dataRow[priceIdx] || "TBD",
                                category: sheetName
                            });
                        }
                    }
                    break; // Stop looking for headers in this sheet once found
                }
            }
        });

        renderMenu(allItems);
    } catch (error) {
        console.error("System Error:", error);
        document.getElementById('menu-list').innerHTML = `
            <div style="color:#0f0; text-align:center; padding:20px; font-family:monospace;">
                [CRITICAL ERROR]<br><br>
                1. Make sure your file is exactly: <b>menu.xlsx</b><br>
                2. Make sure it's in the same folder as index.html<br>
                3. Check the console for: ${error.message}
            </div>`;
    }
}

function renderMenu(items) {
    const list = document.getElementById('menu-list');
    list.innerHTML = ""; 

    if (items.length === 0) {
        list.innerHTML = "<p style='color:white; text-align:center;'>NO ITEMS FOUND IN EXCEL</p>";
        return;
    }

    items.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.style.borderBottom = "1px solid #333";
        row.style.padding = "10px 0";
        row.innerHTML = `
            <div style="display:flex; align-items:center;">
                <input type="checkbox" class="order-check" id="check-${index}" value="${item.strain} (${item.category})" style="width:20px; height:20px; margin-right:10px;">
                <label for="check-${index}" style="display:flex; flex-direction:column;">
                    <span style="color:#fff; font-weight:bold; font-size:16px;">${item.strain}</span>
                    <span style="color:#0f0; font-size:12px;">${item.category} | THC: ${item.thc}% | $${item.price}</span>
                </label>
            </div>
        `;
        list.appendChild(row);
    });
}

function sendEmail() {
    const selected = document.querySelectorAll('.order-check:checked');
    if (selected.length === 0) { alert("Select items first!"); return; }

    let message = "I want to order the following:%0D%0A%0D%0A";
    selected.forEach(box => { message += "- " + box.value + "%0D%0A"; });

    const myEmail = "sales@summacannabis.com"; 
    window.location.href = `mailto:${myEmail}?subject=WHOLESALE ORDER REQUEST&body=${message}`;
}
