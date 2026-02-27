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
        if (!response.ok) throw new Error("File not found");
        
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, {type: 'array'});
        
        let allItems = [];

        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            // We tell it to start reading at the second row to skip those big headers
            const json = XLSX.utils.sheet_to_json(sheet, {range: 1}); 
            
            json.forEach(row => {
                // Only add if it has a Strain name and isn't a blank row
                if (row.Strain && row.Strain !== "Strain") {
                    allItems.push({
                        strain: row.Strain,
                        // This looks for "THC %" or "THC%" automatically
                        thc: row['THC %'] || row['THC%'] || '??',
                        // This looks for "Price" or "1G Single"
                        price: row.Price || row['1G Single'] || 'TBD',
                        category: sheetName
                    });
                }
            });
        });

        renderMenu(allItems);
    } catch (error) {
        console.error(error);
        document.getElementById('menu-list').innerHTML = `<div style="color:white; text-align:center; padding:20px;">
            [SYSTEM ERROR]<br>Make sure your file is named <b>menu.xlsx</b> and is uploaded to GitHub.
        </div>`;
    }
}

function renderMenu(items) {
    const list = document.getElementById('menu-list');
    list.innerHTML = ""; 

    items.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <input type="checkbox" class="order-check" id="check-${index}" value="${item.strain} (${item.category})">
            <label for="check-${index}" class="item-info">
                <span class="strain">${item.strain}</span>
                <span class="details">${item.category} | THC: ${item.thc}% | $${item.price}</span>
            </label>
        `;
        list.appendChild(row);
    });
}

function sendEmail() {
    const selected = document.querySelectorAll('.order-check:checked');
    if (selected.length === 0) { alert("Select items first!"); return; }

    let message = "New Order Request:%0D%0A%0D%0A";
    selected.forEach(box => { message += "- " + box.value + "%0D%0A"; });

    // CHANGE THIS TO YOUR EMAIL
    const myEmail = "sales@summacannabis.com"; 
    window.location.href = `mailto:${myEmail}?subject=WHOLESALE ORDER&body=${message}`;
}
