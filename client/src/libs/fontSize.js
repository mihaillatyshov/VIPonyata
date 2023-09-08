export function getTextWidth(text, font) {
    // re-use canvas object for better performance
    const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
}

// export function getTextWidth(textStr) {
//     const text = document.createElement("span");
//     document.body.appendChild(text);

//     text.style.font = "times new roman";
//     text.style.fontSize = 16 + "px";
//     text.style.height = "auto";
//     text.style.width = "auto";
//     text.style.position = "absolute";
//     text.style.whiteSpace = "no-wrap";
//     text.innerHTML = textStr;

//     const width = Math.ceil(text.clientWidth);
//     const formattedWidth = width + "px";

//     document.querySelector(".output").textContent = formattedWidth;
//     document.body.removeChild(text);
//     return width;
// }
