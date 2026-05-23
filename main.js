function showPage(type, id) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show the selected page
    document.getElementById(type + "-" + id).classList.add('active');
}