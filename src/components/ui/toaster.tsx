"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
    return (
        <Sonner
            position="top-right"
            expand={false}
            richColors
            closeButton
            duration={4000}
            toastOptions={{
                style: {
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                },
                className: 'toast',
            }}
        />
    );
}
