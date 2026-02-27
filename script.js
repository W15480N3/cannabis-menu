window.onload = () => {
    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').style.display = 'block';
    }, 3000); // 3000 milliseconds = 3 seconds
};

function sendEmail() {
    window.location.href = "mailto:boss@company.com?subject=New Order&body=I want the good stuff!";
}
