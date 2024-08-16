// Example of handling form submission with confirmation

document.addEventListener('DOMContentLoaded', function () {
    const deleteForm = document.getElementById('deleteForm');
    
    if (deleteForm) {
        deleteForm.addEventListener('submit', function (event) {
            const confirmation = confirm('Are you sure you want to delete this post?');
            if (!confirmation) {
                event.preventDefault();
            }
        });
    }
});
