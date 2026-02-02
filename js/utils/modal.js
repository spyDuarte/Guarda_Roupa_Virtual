import { showToast } from './toast.js';
import { formatDateKey } from './date.js';

export function createDateModal(callback, title = 'Selecione a Data', confirmText = 'Confirmar') {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-fade-in';
    modal.innerHTML = `
        <div class="bg-white dark:bg-surface-dark rounded-xl w-full max-w-sm overflow-hidden shadow-2xl p-6">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">${title}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Escolha a data.</p>
            <input type="date" id="clone-date-input" class="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 p-3 text-sm text-gray-900 dark:text-white mb-6">
            <div class="flex gap-3">
                <button id="cancel-clone-btn" class="flex-1 py-2 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">Cancelar</button>
                <button id="confirm-clone-btn" class="flex-1 py-2 bg-primary text-slate-900 font-bold rounded-lg hover:opacity-90 transition-opacity">${confirmText}</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = modal.querySelector('#clone-date-input');
    dateInput.value = formatDateKey(tomorrow);

    const close = () => {
        modal.remove();
    };

    modal.querySelector('#cancel-clone-btn').onclick = close;
    modal.querySelector('#confirm-clone-btn').onclick = () => {
        const date = dateInput.value;
        if (date) {
            callback(date);
            close();
        } else {
            showToast('Selecione uma data.', 'error');
        }
    };

    modal.onclick = (e) => {
        if (e.target === modal) close();
    };
}

export function createInputModal(callback, options = {}) {
    const {
        title = 'Inserir Texto',
        description = 'Digite o valor abaixo.',
        placeholder = 'Digite aqui...',
        defaultValue = '',
        confirmText = 'Salvar',
        cancelText = 'Cancelar'
    } = options;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 animate-fade-in';
    modal.innerHTML = `
        <div class="bg-white dark:bg-surface-dark rounded-xl w-full max-w-sm overflow-hidden shadow-2xl p-6 relative z-10">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">${title}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">${description}</p>
            <input type="text" id="modal-input" class="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 p-3 text-sm text-gray-900 dark:text-white mb-6" placeholder="${placeholder}" value="${defaultValue}">
            <div class="flex gap-3">
                <button id="cancel-modal-btn" class="flex-1 py-2 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">${cancelText}</button>
                <button id="confirm-modal-btn" class="flex-1 py-2 bg-primary text-slate-900 font-bold rounded-lg hover:opacity-90 transition-opacity">${confirmText}</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const input = modal.querySelector('#modal-input');
    setTimeout(() => {
        input.focus();
        if (defaultValue) input.select();
    }, 50);

    const close = () => {
        modal.remove();
    };

    modal.querySelector('#cancel-modal-btn').onclick = close;
    modal.querySelector('#confirm-modal-btn').onclick = () => {
        const value = input.value.trim();
        if (value) {
            callback(value);
            close();
        } else {
            showToast('O campo não pode ficar vazio.', 'error');
        }
    };

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
             modal.querySelector('#confirm-modal-btn').click();
        }
    });

    modal.onclick = (e) => {
        if (e.target === modal) close();
    };
}
