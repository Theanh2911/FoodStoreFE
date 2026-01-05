"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmOptions {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = React.createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [options, setOptions] = React.useState<ConfirmOptions | null>(null);
    const resolveRef = React.useRef<((value: boolean) => void) | null>(null);

    const confirm = React.useCallback((opts: ConfirmOptions): Promise<boolean> => {
        setOptions(opts);
        setIsOpen(true);
        return new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
        });
    }, []);

    const handleConfirm = () => {
        resolveRef.current?.(true);
        setIsOpen(false);
        setOptions(null);
    };

    const handleCancel = () => {
        resolveRef.current?.(false);
        setIsOpen(false);
        setOptions(null);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <Dialog open={isOpen} onOpenChange={(open) => {
                if (!open) handleCancel();
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{options?.title}</DialogTitle>
                        <DialogDescription>{options?.description}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                        >
                            {options?.cancelText || "Huỷ"}
                        </Button>
                        <Button
                            type="button"
                            variant={options?.variant || "default"}
                            onClick={handleConfirm}
                        >
                            {options?.confirmText || "Đồng ý"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = React.useContext(ConfirmContext);
    if (!context) {
        throw new Error("useConfirm must be used within ConfirmDialogProvider");
    }
    return context.confirm;
}
