window.onload = () => {
    // 1. The 3-second Loading Screen
    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        
        // 2. Automatically load the menu file from the GitHub folder
        loadMenuFromFile();
    }, 3000);
};

async function loadMenuFromFile() {
    try {
        // This looks for the file you uploaded to GitHub
        const response = await fetch('menu.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, {type: 'array'});
        
        let allItems = [];

        // This goes through every sheet (Prerolls, 8ths, etc.)
        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            // header: 1 means it looks for the first row with text
            const json = XLSX.utils.sheet_to_json(sheet);
            
            // We add the category name (like "Prerolls") to the items
            const itemsWithCategory = json.map(item => ({...item, category: sheetName}));
            allItems = allItems.concat(itemsWithCategory);
        });

        renderMenu(allItems);
    } catch (error) {
        console.error("Error loading menu:", error);
        document.getElementById('menu-list').innerHTML = "<p style='color:red; text-align:center;'>ERROR: menu.xlsx not found in GitHub folder.</p>";
    }
}

function renderMenu(items) {
    const list = document.getElementById('menu-list');
    list.innerHTML = ""; 

    items.forEach((item) => {
        // Your Excel uses "Strain" as the column name
        if (item.Strain) {
            const row = document.createElement('div');
            row.className = 'item-row';
            row.innerHTML = `
                <input type="checkbox" class="order-check" value="${item.Strain} (${item.category})">
                <div class="item-info">
                    <span class="strain">${item.Strain}</span>
                    <span class="details">${item.category} | THC: ${item['THC %'] || item['THC%'] || '??'}% | $${item.Price || 'TBD'}</span>
                </div>
            `;
            list.appendChild(row);
        }
    });
}

function sendEmail() {
    const selected = document.querySelectorAll('.order-check:checked');
    let message = "Yo! I'm looking to grab these items from the menu:%0D%0A%0D%0A";
    
    selected.forEach(box => {
        message += "- " + box.value + "%0D%0A";
    });

    if (selected.length === 0) {
        alert("Select some fire first!");
        return;
    }

    // UPDATE THIS to your real sales email!
    const myEmail = "sales@yourcompany.com"; 
    window.location.href = `mailto:${myEmail}?subject=NEW ORDER REQUEST&body=${message}`;
}
