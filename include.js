// Simple HTML Include Script
(function() {
    function includeHTML() {
        const elements = document.querySelectorAll('[data-include]');
        elements.forEach(function(el) {
            const file = el.getAttribute('data-include');
            if (file) {
                fetch(file)
                    .then(response => response.text())
                    .then(data => {
                        el.innerHTML = data;
                        // Re-initialize any scripts that need to run after include
                        if (typeof initAfterInclude === 'function') {
                            initAfterInclude();
                        }
                    })
                    .catch(err => {
                        console.error('Error loading include file:', file, err);
                    });
            }
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', includeHTML);
    } else {
        includeHTML();
    }
})();

