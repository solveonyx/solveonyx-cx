"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type PopupProps = {
    open: boolean
    title?: string
    message: string
    okLabel?: string
    onOk: () => void
}

export function Popup({
    open,
    title = "Notice",
    message,
    okLabel = "OK",
    onOk
}: PopupProps) {
    return (
        <Dialog open={open}>
            <DialogContent
                showCloseButton={false}
                onEscapeKeyDown={(event) => event.preventDefault()}
                onPointerDownOutside={(event) => event.preventDefault()}
                onInteractOutside={(event) => event.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{message}</DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button type="button" onClick={onOk}>
                        {okLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
