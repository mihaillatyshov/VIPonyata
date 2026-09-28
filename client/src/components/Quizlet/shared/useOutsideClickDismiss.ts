import { useEffect, useEffectEvent } from "react";

/** Пока `isActive`, клик вне элемента, подходящего под `containerSelector`, вызывает `onDismiss` (закрыть «Точно?»). */
export const useOutsideClickDismiss = (isActive: boolean, containerSelector: string, onDismiss: () => void) => {
    const dismiss = useEffectEvent(onDismiss);

    useEffect(() => {
        if (!isActive) {
            return;
        }

        const handleOutsideClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest(containerSelector)) {
                return;
            }
            dismiss();
        };

        document.addEventListener("click", handleOutsideClick);
        return () => document.removeEventListener("click", handleOutsideClick);
    }, [isActive, containerSelector]);
};
