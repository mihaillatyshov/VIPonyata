export const getBase64Image = (imageUrl: string) => {
    const image = new Image();
    image.src = imageUrl;

    const canvas = document.createElement("canvas");
    canvas.width = image.clientWidth;
    canvas.height = image.clientHeight;
    const ctx = canvas.getContext("2d");
    if (ctx !== null) {
        ctx.drawImage(image, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
    }
};
