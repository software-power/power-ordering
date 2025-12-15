import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import Modal from '../components/Modal';

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean; // If true, confirm button is red
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({ message: '' });
    const resolveRef = useRef<(value: boolean) => void>(() => { });

    const confirm = useCallback((opts: ConfirmOptions | string) => {
        const finalOptions = typeof opts === 'string' ? { message: opts } : opts;
        setOptions({
            title: 'Confirmation',
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            ...finalOptions
        });
        setIsOpen(true);
        return new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
        });
    }, []);

    const handleCancel = () => {
        setIsOpen(false);
        resolveRef.current(false);
    };

    const handleConfirm = () => {
        setIsOpen(false);
        resolveRef.current(true);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <Modal
                isOpen={isOpen}
                onClose={handleCancel}
                title={options.title || 'Confirmation'}
            >
                <div style={{ color: '#475569', fontSize: '1rem', marginBottom: '1.5rem' }}>
                    {options.message}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button
                        onClick={handleCancel}
                        style={{
                            padding: '0.6rem 1.25rem',
                            borderRadius: '0.375rem',
                            backgroundColor: 'white',
                            border: '1px solid #cbd5e1',
                            color: '#475569',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >
                        {options.cancelText || 'Cancel'}
                    </button>
                    <button
                        onClick={handleConfirm}
                        style={{
                            padding: '0.6rem 1.25rem',
                            borderRadius: '0.375rem',
                            backgroundColor: options.danger ? '#ef4444' : '#3b82f6',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >
                        {options.confirmText || 'Confirm'}
                    </button>
                </div>
            </Modal>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context.confirm;
}
