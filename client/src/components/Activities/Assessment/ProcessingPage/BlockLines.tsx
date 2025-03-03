import React, { useEffect, useRef } from "react";

interface BlockLinesProps {
    lines: string[];
}

const BlockLines = ({ lines }: BlockLinesProps) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        const updateLines = () => {
            if (lines.length % 2 !== 0) {
                return;
            }
            const svgRect = svg.getBoundingClientRect();
            const elements = lines.map((id) => document.getElementById(id));
            const lineElements = svg.querySelectorAll("line");

            elements.forEach((el1, index) => {
                if (index % 2 !== 0) return;
                const el2 = elements[index + 1];
                if (!el1 || !el2) return;

                const rect1 = el1.getBoundingClientRect();
                const rect2 = el2.getBoundingClientRect();
                const line = lineElements[index] as SVGLineElement;

                if (line) {
                    line.setAttribute("x1", `${rect1.left - svgRect.left - 16}`);
                    line.setAttribute("y1", `${rect1.top - svgRect.top + rect1.height / 2}`);
                    line.setAttribute("x2", `${rect2.left - svgRect.left - 16}`);
                    line.setAttribute("y2", `${rect2.top - svgRect.top + rect2.height / 2}`);
                }
            });
        };

        updateLines();
        window.addEventListener("resize", updateLines);
        return () => window.removeEventListener("resize", updateLines);
    }, [lines]);

    return (
        <svg
            ref={svgRef}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        >
            {lines.map((_, index) => (
                <line key={index} stroke="black" strokeWidth="2" />
            ))}
        </svg>
    );
};

export default BlockLines;
