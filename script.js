window.onload = () => {
    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').style.display = 'block';
    }, 3000);

    document.getElementById('excel-upload').addEventListener('change', handleFile, false);
};

function handleFile(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Let's combine all sheets (Prerolls, 8ths, etc.) into one big list
        let allItems = [];
        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet);
            allItems = allItems.concat(json);
        });

        renderMenu(allItems);
    };
    reader.readAsArrayBuffer(file);
}

function renderMenu(items) {
    const list = document.getElementById('menu-list');
    list.innerHTML = ""; // Clear loader text

    items.forEach((item) => {
        // Only show rows that actually have a strain name
        if (item.Strain) {
            const row = document.createElement('div');
            row.className = 'item-row';
            row.innerHTML = `
                <input type="checkbox" class="order-check" value="${item.Strain}">
                <div class="item-info">
                    <span class="strain">${item.Strain}</span>
                    <span class="details">THC: ${item['THC%'] || '??'}% | Price: $${item.Price || 'TBD'}</span>
                </div>
            `;
            list.appendChild(row);
        }
    });
}

function sendEmail() {
    const selected = document.querySelectorAll('.order-check:checked');
    let message = "I am interested in these items from the menu:%0D%0A%0D%0A";
    
    selected.forEach(box => {
        message += "- " + box.value + "%0D%0A";
    });

    if (selected.length === 0) {
        alert("Please select at least one item!");
        return;
    }

    // Replace this with your actual email!
    window.location.href = `mailto:sales@summacannabis.com?subject=Wholesale Order Inquiry&body=${message}`;
}
