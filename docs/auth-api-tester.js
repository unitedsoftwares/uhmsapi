// State Management
const state = {
    currentStep: 'register',
    tokens: {
        access: null,
        refresh: null
    },
    responseData: {
        body: null,
        headers: null,
        raw: null
    },
    activeTab: 'body'
};

// API Endpoints Configuration
const endpoints = {
    register: {
        method: 'POST',
        path: '/auth/register',
        fields: [
            { name: 'username', type: 'text', label: 'Username', required: true, placeholder: 'alphanumeric, 3-30 chars' },
            { name: 'email', type: 'email', label: 'Email Address', required: true },
            { name: 'password', type: 'password', label: 'Password', required: true, placeholder: 'Min 8 chars, 1 upper, 1 lower, 1 number, 1 special' },
            { name: 'first_name', type: 'text', label: 'First Name', required: true, placeholder: 'Letters and spaces only' },
            { name: 'last_name', type: 'text', label: 'Last Name', required: true, placeholder: 'Letters and spaces only' },
            { name: 'phone', type: 'tel', label: 'Phone Number', required: true, placeholder: '10 digits' },
            { name: 'company_id', type: 'number', label: 'Company ID (Optional)', required: false, placeholder: 'Leave empty to create new company' },
            { name: 'role_id', type: 'number', label: 'Role ID (Optional)', required: false, placeholder: 'Leave empty for admin role' },
            { name: 'company_name', type: 'text', label: 'Company Name', required: false, placeholder: 'For new company creation' },
            { name: 'company_email', type: 'email', label: 'Company Email', required: false, placeholder: 'For new company creation' },
            { name: 'company_phone', type: 'tel', label: 'Company Phone', required: false, placeholder: 'For new company creation' }
        ]
    },
    complete: {
        method: 'POST',
        path: '/auth/register-complete',
        fields: [
            { name: 'email', type: 'email', label: 'Email Address', required: true },
            { name: 'password', type: 'password', label: 'Password', required: true, placeholder: 'Min 8 chars, 1 upper, 1 lower, 1 number, 1 special' },
            { name: 'first_name', type: 'text', label: 'First Name', required: true },
            { name: 'last_name', type: 'text', label: 'Last Name', required: true },
            { name: 'phone', type: 'tel', label: 'Phone Number', required: true, placeholder: '10 digits' },
            { name: 'company_name', type: 'text', label: 'Company Name', required: true },
            { name: 'is_admin', type: 'checkbox', label: 'Is Admin', required: false, value: 'true' }
        ]
    },
    login: {
        method: 'POST',
        path: '/auth/login',
        fields: [
            { name: 'email', type: 'email', label: 'Email Address', required: true },
            { name: 'password', type: 'password', label: 'Password', required: true }
        ]
    },
    profile: {
        method: 'GET',
        path: '/auth/profile',
        fields: [],
        requiresAuth: true
    },
    refresh: {
        method: 'POST',
        path: '/auth/refresh-token',
        fields: [
            { name: 'refreshToken', type: 'text', label: 'Refresh Token', required: true, prefill: 'refresh' }
        ]
    },
    logout: {
        method: 'POST',
        path: '/auth/logout',
        fields: [],
        requiresAuth: true
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Auto-detect API port from current URL
    const currentPort = window.location.port || '80';
    
    // Check for port parameter in URL first
    const urlParams = new URLSearchParams(window.location.search);
    const port = urlParams.get('port') || currentPort;
    
    // Set the base URL
    document.getElementById('baseUrl').value = `http://localhost:${port}/api/v1`;
    
    loadStep('register');
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Step Navigation
    document.querySelectorAll('.step-item').forEach(item => {
        item.addEventListener('click', () => {
            const step = item.dataset.step;
            loadStep(step);
        });
    });

    // Tab Navigation
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });
}

// Load Step Content
function loadStep(step) {
    state.currentStep = step;
    const endpoint = endpoints[step];
    
    if (!endpoint) {
        console.error('Endpoint not found for step:', step);
        return;
    }
    
    // Update active step
    document.querySelectorAll('.step-item').forEach(item => {
        item.classList.toggle('active', item.dataset.step === step);
    });

    // Generate form content
    const requestContent = document.getElementById('requestContent');
    const formFieldsHTML = generateFormFields(endpoint.fields || [], step);
    
    requestContent.innerHTML = `
        <div class="endpoint-display">
            <span class="method-badge method-${endpoint.method.toLowerCase()}">${endpoint.method}</span>
            <span style="flex: 1;">${endpoint.path}</span>
        </div>
        ${formFieldsHTML}
        <button class="btn btn-primary" onclick="sendRequest()">
            <span>Send Request</span>
            <span>→</span>
        </button>
        ${endpoint.requiresAuth ? '<p style="margin-top: 1rem; font-size: 0.875rem; color: var(--text-dim);">⚠️ This endpoint requires authentication</p>' : ''}
    `;
}

// Generate Form Fields
function generateFormFields(fields, step) {
    if (fields.length === 0) return '';

    return fields.map(field => {
        let value = '';
        if (field.prefill === 'refresh' && state.tokens.refresh) {
            value = state.tokens.refresh;
        }

        // Use default value if provided
        if (!value && field.value) {
            value = field.value;
        }

        // Handle checkbox type
        if (field.type === 'checkbox') {
            return `
                <div class="form-group">
                    <label class="form-label" style="display: flex; align-items: center; gap: 0.5rem;">
                        <input 
                            type="checkbox" 
                            id="${field.name}" 
                            name="${field.name}"
                            ${value === 'true' ? 'checked' : ''}
                            style="width: auto;"
                        />
                        ${field.label}
                    </label>
                </div>
            `;
        }

        return `
            <div class="form-group">
                <label class="form-label" for="${field.name}">
                    ${field.label} ${field.required ? '<span style="color: var(--error)">*</span>' : ''}
                </label>
                <input 
                    type="${field.type}" 
                    class="form-input" 
                    id="${field.name}" 
                    name="${field.name}"
                    value="${value}"
                    ${field.required ? 'required' : ''}
                    placeholder="${field.placeholder || 'Enter ' + field.label.toLowerCase()}"
                />
                <div class="input-error" id="${field.name}-error"></div>
            </div>
        `;
    }).join('');
}

// Send Request
window.sendRequest = async function() {
    const endpoint = endpoints[state.currentStep];
    const baseUrl = document.getElementById('baseUrl').value;
    const url = baseUrl + endpoint.path;

    // Clear previous errors
    document.querySelectorAll('.input-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));

    // Collect form data
    const formData = {};
    let hasErrors = false;

    endpoint.fields.forEach(field => {
        const input = document.getElementById(field.name);
        let value;

        if (field.type === 'checkbox') {
            value = input?.checked;
            if (value !== undefined) {
                formData[field.name] = value;
            }
        } else {
            value = input?.value?.trim();
            
            if (field.required && !value) {
                input.classList.add('error');
                const errorEl = document.getElementById(`${field.name}-error`);
                if (errorEl) {
                    errorEl.textContent = 'This field is required';
                }
                hasErrors = true;
            } else if (value) {
                // Convert to number if type is number
                if (field.type === 'number') {
                    formData[field.name] = parseInt(value, 10);
                } else {
                    formData[field.name] = value;
                }
            }
        }
    });

    if (hasErrors) return;

    // Prepare request options
    const options = {
        method: endpoint.method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    // Add auth header if required
    if (endpoint.requiresAuth && state.tokens.access) {
        options.headers['Authorization'] = `Bearer ${state.tokens.access}`;
    }

    // Add body for POST/PATCH requests
    if (['POST', 'PATCH', 'PUT'].includes(endpoint.method) && Object.keys(formData).length > 0) {
        options.body = JSON.stringify(formData);
    }

    // Show loading state
    updateResponsePanel({ loading: true });

    try {
        const startTime = performance.now();
        const response = await fetch(url, options);
        const responseTime = Math.round(performance.now() - startTime);

        const responseData = await response.json();
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });

        // Store tokens if present
        if (responseData.data?.accessToken) {
            state.tokens.access = responseData.data.accessToken;
        }
        if (responseData.data?.refreshToken) {
            state.tokens.refresh = responseData.data.refreshToken;
        }

        // Update response panel
        updateResponsePanel({
            status: response.status,
            statusText: response.statusText,
            body: responseData,
            headers: headers,
            responseTime: responseTime,
            success: response.ok
        });

        // Mark step as completed if successful
        if (response.ok) {
            document.querySelector(`.step-item[data-step="${state.currentStep}"]`).classList.add('completed');
        }

    } catch (error) {
        updateResponsePanel({
            error: true,
            message: error.message
        });
    }
}

// Update Response Panel
function updateResponsePanel(data) {
    const statusIndicator = document.getElementById('statusIndicator');
    const responseContent = document.getElementById('responseContent');
    const tokenDisplay = document.getElementById('tokenDisplay');

    if (data.loading) {
        statusIndicator.innerHTML = '<div class="spinner"></div>';
        responseContent.innerHTML = '<div style="text-align: center; padding: 3rem;"><div class="spinner"></div><p style="margin-top: 1rem; color: var(--text-dim);">Sending request...</p></div>';
        return;
    }

    // Status indicator
    if (data.error) {
        statusIndicator.innerHTML = `<div class="status-indicator status-error">Error</div>`;
        responseContent.innerHTML = `<div style="color: var(--error);">Network Error: ${data.message}</div>`;
        responseContent.className = 'response-content error';
        return;
    }

    statusIndicator.innerHTML = `
        <div class="status-indicator ${data.success ? 'status-success' : 'status-error'}">
            ${data.status} ${data.statusText}
        </div>
        <span style="font-size: 0.75rem; color: var(--text-dim);">${data.responseTime}ms</span>
    `;

    // Store response data
    state.responseData = {
        body: JSON.stringify(data.body, null, 2),
        headers: JSON.stringify(data.headers, null, 2),
        raw: JSON.stringify({ status: data.status, ...data.body }, null, 2)
    };

    // Update content based on active tab
    updateTabContent();

    // Update response styling
    responseContent.className = `response-content ${data.success ? 'success' : 'error'}`;

    // Display tokens if present
    if (data.body?.data?.accessToken || data.body?.data?.refreshToken) {
        let tokenHTML = '<div class="token-display">';
        
        if (data.body.data.accessToken) {
            tokenHTML += `
                <div style="margin-bottom: 1rem;">
                    <div class="token-label">Access Token</div>
                    <div class="token-value">
                        <span style="flex: 1; overflow: hidden; text-overflow: ellipsis;">${data.body.data.accessToken}</span>
                        <button class="copy-btn" onclick="copyToClipboard('${data.body.data.accessToken}')">📋</button>
                    </div>
                </div>
            `;
        }
        
        if (data.body.data.refreshToken) {
            tokenHTML += `
                <div>
                    <div class="token-label">Refresh Token</div>
                    <div class="token-value">
                        <span style="flex: 1; overflow: hidden; text-overflow: ellipsis;">${data.body.data.refreshToken}</span>
                        <button class="copy-btn" onclick="copyToClipboard('${data.body.data.refreshToken}')">📋</button>
                    </div>
                </div>
            `;
        }
        
        tokenHTML += '</div>';
        tokenDisplay.innerHTML = tokenHTML;
    } else {
        tokenDisplay.innerHTML = '';
    }
}

// Switch Tab
function switchTab(tab) {
    state.activeTab = tab;
    
    // Update tab UI
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });

    updateTabContent();
}

// Update Tab Content
function updateTabContent() {
    const responseContent = document.getElementById('responseContent');
    
    if (!state.responseData.body) {
        responseContent.innerHTML = '<div style="color: var(--text-dim); text-align: center; padding: 3rem;">No response data available</div>';
        return;
    }

    switch (state.activeTab) {
        case 'body':
            responseContent.textContent = state.responseData.body;
            break;
        case 'headers':
            responseContent.textContent = state.responseData.headers;
            break;
        case 'raw':
            responseContent.textContent = state.responseData.raw;
            break;
    }
}

// Copy to Clipboard
window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show feedback
        event.target.textContent = '✓';
        setTimeout(() => {
            event.target.textContent = '📋';
        }, 2000);
    });
}