import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type MouseEvent } from "react";

interface TableCellPosition {
    rowIndex: number;
    colIndex: number;
}

interface TableSelection {
    start: TableCellPosition;
    end: TableCellPosition;
}

const normalizeSelection = (selection: TableSelection) => ({
    startRow: Math.min(selection.start.rowIndex, selection.end.rowIndex),
    endRow: Math.max(selection.start.rowIndex, selection.end.rowIndex),
    startCol: Math.min(selection.start.colIndex, selection.end.colIndex),
    endCol: Math.max(selection.start.colIndex, selection.end.colIndex),
});

const hasNativeTextSelection = () => {
    const activeElement = document.activeElement;

    if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
        return activeElement.selectionStart !== activeElement.selectionEnd;
    }

    return (window.getSelection()?.toString() ?? "") !== "";
};

export const copyTableRowsAsTsv = <TCol extends string, TRow extends Record<TCol, string>>(
    event: ClipboardEvent<HTMLTableElement>,
    rows: TRow[],
    cols: readonly TCol[],
    isRowEmpty: (row: TRow) => boolean,
    selection: TableSelection | null,
) => {
    if (hasNativeTextSelection()) {
        return;
    }

    const normalizedSelection = selection ? normalizeSelection(selection) : null;
    const text = normalizedSelection
        ? rows
              .slice(normalizedSelection.startRow, normalizedSelection.endRow + 1)
              .map((row) =>
                  cols
                      .slice(normalizedSelection.startCol, normalizedSelection.endCol + 1)
                      .map((col) => row[col].trim())
                      .join("\t"),
              )
              .join("\r\n")
        : rows
              .filter((row) => !isRowEmpty(row))
              .map((row) => cols.map((col) => row[col].trim()).join("\t"))
              .join("\r\n");

    if (text.trim() === "") {
        return;
    }

    event.preventDefault();
    event.clipboardData.setData("text/plain", text);
};

export const useQuizletTableSelection = (rowCount: number, colCount: number) => {
    const [selection, setSelection] = useState<TableSelection | null>(null);
    const isSelectingRef = useRef(false);

    useEffect(() => {
        const stopSelection = () => {
            isSelectingRef.current = false;
        };

        window.addEventListener("mouseup", stopSelection);
        return () => window.removeEventListener("mouseup", stopSelection);
    }, []);

    useEffect(() => {
        setSelection((currentSelection) => {
            if (currentSelection === null || rowCount < 1 || colCount < 1) {
                return currentSelection;
            }

            const clampPosition = ({ rowIndex, colIndex }: TableCellPosition): TableCellPosition => ({
                rowIndex: Math.max(0, Math.min(rowIndex, rowCount - 1)),
                colIndex: Math.max(0, Math.min(colIndex, colCount - 1)),
            });

            return {
                start: clampPosition(currentSelection.start),
                end: clampPosition(currentSelection.end),
            };
        });
    }, [rowCount, colCount]);

    const normalizedSelection = useMemo(() => {
        if (selection === null) {
            return null;
        }

        return normalizeSelection(selection);
    }, [selection]);

    const selectCell = (rowIndex: number, colIndex: number, extendSelection: boolean) => {
        setSelection((currentSelection) => {
            if (extendSelection && currentSelection !== null) {
                return {
                    start: currentSelection.start,
                    end: { rowIndex, colIndex },
                };
            }

            return {
                start: { rowIndex, colIndex },
                end: { rowIndex, colIndex },
            };
        });
    };

    const handleCellMouseDown = (event: MouseEvent<HTMLElement>, rowIndex: number, colIndex: number) => {
        if (event.button !== 0) {
            return;
        }

        isSelectingRef.current = true;
        selectCell(rowIndex, colIndex, event.shiftKey);
    };

    const handleCellMouseEnter = (rowIndex: number, colIndex: number) => {
        if (!isSelectingRef.current) {
            return;
        }

        setSelection((currentSelection) => {
            if (currentSelection === null) {
                return {
                    start: { rowIndex, colIndex },
                    end: { rowIndex, colIndex },
                };
            }

            return {
                start: currentSelection.start,
                end: { rowIndex, colIndex },
            };
        });
    };

    const handleCellFocus = (rowIndex: number, colIndex: number) => {
        selectCell(rowIndex, colIndex, false);
    };

    const isCellSelected = (rowIndex: number, colIndex: number) => {
        if (normalizedSelection === null) {
            return false;
        }

        return (
            rowIndex >= normalizedSelection.startRow &&
            rowIndex <= normalizedSelection.endRow &&
            colIndex >= normalizedSelection.startCol &&
            colIndex <= normalizedSelection.endCol
        );
    };

    return {
        selection,
        handleCellMouseDown,
        handleCellMouseEnter,
        handleCellFocus,
        isCellSelected,
    };
};
