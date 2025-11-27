// Simple HTML Include Script
(function() {
    let globalComponentsLoaded = false;

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

    function loadGlobalComponents() {
        if (globalComponentsLoaded || document.getElementById('scroll-to-top-btn')) {
            globalComponentsLoaded = true;
            return;
        }

        fetch('scroll-to-top.html')
            .then(response => response.text())
            .then(html => {
                if (!document.getElementById('scroll-to-top-btn')) {
                    const temp = document.createElement('div');
                    temp.innerHTML = html.trim();
                    const component = temp.firstElementChild;
                    if (component) {
                        document.body.appendChild(component);
                    }
                }
                globalComponentsLoaded = true;
                if (typeof initAfterInclude === 'function') {
                    initAfterInclude();
                }
            })
            .catch(err => {
                console.error('Error loading global component:', err);
            });
    }

    function initIncludes() {
        includeHTML();
        loadGlobalComponents();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initIncludes);
    } else {
        initIncludes();
    }
})();

