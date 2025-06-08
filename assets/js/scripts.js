let currentLang = localStorage.getItem('lang') || 'es';
let translations = {};

document.addEventListener('DOMContentLoaded', function () {
    loadTranslations(currentLang)
        .then(() => {
            loadServices(currentLang);
            loadPortfolio(currentLang);
            setupModalEvents();
        });

    // Language switcher
    document.querySelectorAll('[data-lang]').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            currentLang = this.getAttribute('data-lang');
            localStorage.setItem('lang', currentLang);
            
            loadTranslations(currentLang)
                .then(() => {
                    loadServices(currentLang);
                    loadPortfolio(currentLang);
                });
        });
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', function () {
        const navbar = document.querySelector('.navbar');
        navbar.classList.toggle('navbar-scrolled', window.scrollY > 50);
    });
});

function loadTranslations(lang) {
    return fetch(`data/translations.json?v=${new Date().getTime()}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            translations = data[lang] || {};
            applyTranslations();
            return translations;
        })
        .catch(error => {
            console.error('Error loading translations:', error);
            translations = {};
            return translations;
        });
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = translations[key];
        
        if (translation) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else if (element.tagName === 'SELECT') {
                // Manejar opciones de select
                const options = element.options;
                for (let i = 0; i < options.length; i++) {
                    if (options[i].hasAttribute('data-i18n-option')) {
                        const optionKey = options[i].getAttribute('data-i18n-option');
                        if (translations[optionKey]) {
                            options[i].textContent = translations[optionKey];
                        }
                    }
                }
            } else {
                element.textContent = translation;
            }
        } else {
            console.warn(`Missing translation for key: ${key}`);
        }
    });
}

function loadServices(lang) {
    fetch('data/services.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            const carouselInner = document.getElementById('services-carousel-inner');
            const aboutServicesList = document.getElementById('about-services-list');
            carouselInner.innerHTML = '';
            aboutServicesList.innerHTML = '';

            // Group services into sets of 3 for the carousel
            for (let i = 0; i < data.services.length; i += 3) {
                const carouselItem = document.createElement('div');
                carouselItem.classList.add('carousel-item');
                if (i === 0) carouselItem.classList.add('active');

                const row = document.createElement('div');
                row.classList.add('row', 'justify-content-center');

                for (let j = 0; j < 3; j++) {
                    const serviceIndex = i + j;
                    if (serviceIndex < data.services.length) {
                        const service = data.services[serviceIndex];
                        const translation = service.translations[lang] || service.translations['es'];
                        
                        row.appendChild(createServiceCard(service, translation));
                        aboutServicesList.appendChild(createServiceListItem(translation));
                    }
                }
                carouselItem.appendChild(row);
                carouselInner.appendChild(carouselItem);
            }
        })
        .catch(error => console.error('Error loading services:', error));
}

function createServiceCard(service, translation) {
    const colDiv = document.createElement('div');
    colDiv.classList.add('col-md-4');
    colDiv.innerHTML = `
        <div class="card card-service p-4 text-center">
            <div class="icon">
                <i class="${service.icon}"></i>
            </div>
            <h4>${translation.title}</h4>
            <p>${translation.description}</p>
        </div>
    `;
    return colDiv;
}

function createServiceListItem(translation) {
    const colDiv = document.createElement('div');
    colDiv.classList.add('col-md-6');
    colDiv.innerHTML = `
        <ul class="list-unstyled">
            <li class="mb-3"><i class="fas fa-check-circle text-primary me-2"></i> ${translation.title}</li>
        </ul>
    `;
    return colDiv;
}

function loadPortfolio(lang = currentLang) {
    fetch('data/portfolio.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(projects => displayProjects(projects, lang))
        .catch(error => {
            console.error('Error loading portfolio:', error);
            displayProjects(getFallbackProjects(), lang);
        });
}

function createProjectCard(project, lang, maxHeight = null) {
    const translation = project.translations[lang] || project.translations['es'];
    const card = document.createElement('div');
    card.classList.add('portfolio-item', 'shadow-sm');
    
    if (maxHeight) card.style.minHeight = `${maxHeight}px`;
    
    // Texto seguro para "Ver más"
    const viewMoreText = translations.viewMore || 
                       (lang === 'en' ? 'View more' : 
                        lang === 'fr' ? 'Voir plus' : 'Ver más');
    
    card.innerHTML = `
        <img src="assets/img/works/${project.image}" class="portfolio-img" alt="${translation.title}">
        <div class="portfolio-overlay text-center">
            <h4>${translation.title}</h4>
            <p>${translation.description}</p>
            <button class="btn btn-outline-light view-details" 
                    data-title="${translation.title}" 
                    data-highlights='${JSON.stringify(translation.highlights)}'
                    data-bs-toggle="modal" 
                    data-bs-target="#portfolioModal">
                ${viewMoreText}
            </button>
        </div>
    `;
    
    return card;
}

function displayProjects(projects, lang = currentLang) {
    const container = document.getElementById('portfolio-items-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Calcular altura máxima
    let maxHeight = 0;
    const tempContainer = document.createElement('div');
    document.body.appendChild(tempContainer);
    
    projects.forEach(project => {
        const card = createProjectCard(project, lang);
        tempContainer.appendChild(card);
        maxHeight = Math.max(maxHeight, card.offsetHeight);
        tempContainer.removeChild(card);
    });
    
    document.body.removeChild(tempContainer);
    
    // Crear tarjetas con altura uniforme
    projects.forEach(project => {
        container.appendChild(createProjectCard(project, lang, maxHeight));
    });
}

function setupModalEvents() {
    document.addEventListener('click', function(e) {
        if (e.target?.classList.contains('view-details')) {
            const button = e.target;
            const title = button.getAttribute('data-title');
            const highlights = JSON.parse(button.getAttribute('data-highlights'));
            
            document.getElementById('modalTitle').textContent = title;
            
            const list = document.getElementById('modalHighlights');
            list.innerHTML = '';
            highlights.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                list.appendChild(li);
            });
        }
    });
}

function displayError(message) {
    const portfolioContainer = document.getElementById('portfolio-items-container');
    if (portfolioContainer) {
        const helpText = translations.portfolioErrorHelp || 
                        (currentLang === 'en' ? 'Please check the projects file or try reloading the page.' :
                         currentLang === 'fr' ? 'Veuillez vérifier le fichier des projets ou réessayer plus tard.' :
                         'Por favor verifica el archivo de proyectos o intenta recargar la página.');
        
        portfolioContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                <h3>${message}</h3>
                <p class="text-muted">${helpText}</p>
            </div>
        `;
    }
}

function getFallbackProjects() {
    return [
        {
            "image": "default.jpg",
            "translations": {
                "es": {
                    "title": "Proyecto de Ejemplo",
                    "description": "Este es un proyecto de ejemplo que se muestra cuando no se pueden cargar los proyectos reales.",
                    "highlights": [
                        "Proyecto de ejemplo para mostrar cuando hay un error",
                        "No representa un proyecto real",
                        "Recarga la página o intenta más tarde"
                    ]
                },
                "en": {
                    "title": "Example Project",
                    "description": "This is an example project shown when real projects cannot be loaded.",
                    "highlights": [
                        "Example project to show when there's an error",
                        "Does not represent a real project",
                        "Refresh the page or try again later"
                    ]
                },
                "fr": {
                    "title": "Projet Exemple",
                    "description": "Ceci est un projet exemple affiché lorsque les projets réels ne peuvent pas être chargés.",
                    "highlights": [
                        "Projet exemple à afficher en cas d'erreur",
                        "Ne représente pas un projet réel",
                        "Actualisez la page ou réessayez plus tard"
                    ]
                }
            }
        }
    ];
}