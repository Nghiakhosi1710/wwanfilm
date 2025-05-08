import { useEffect, useRef, useState } from "react";

const useImageBorderShadow = (imageUrl) => {
    const imgRef = useRef(null);
    const [shadowStyle, setShadowStyle] = useState("");

    useEffect(() => {
        const img = imgRef.current;
        if (!img) return;

        img.crossOrigin = "Anonymous";

        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0, img.width, img.height);

                const getAverageColor = (xStart, yStart, width, height) => {
                    let data = ctx.getImageData(xStart, yStart, width, height).data;
                    let r = 0, g = 0, b = 0, count = 0;
                    for (let i = 0; i < data.length; i += 4) {
                        r += data[i];
                        g += data[i + 1];
                        b += data[i + 2];
                        count++;
                    }
                    return `rgba(${Math.floor(r / count)}, ${Math.floor(g / count)}, ${Math.floor(b / count)}, 0.6)`;
                };

                const borderThickness = 10;
                const topColor1 = getAverageColor(0, 0, img.width / 2, borderThickness);
                const topColor2 = getAverageColor(img.width / 2, 0, img.width / 2, borderThickness);
                const bottomColor1 = getAverageColor(0, img.height - borderThickness, img.width / 2, borderThickness);
                const bottomColor2 = getAverageColor(img.width / 2, img.height - borderThickness, img.width / 2, borderThickness);
                const leftColor1 = getAverageColor(0, 0, borderThickness, img.height / 2);
                const leftColor2 = getAverageColor(0, img.height / 2, borderThickness, img.height / 2);
                const rightColor1 = getAverageColor(img.width - borderThickness, 0, borderThickness, img.height / 2);
                const rightColor2 = getAverageColor(img.width - borderThickness, img.height / 2, borderThickness, img.height / 2);

                setShadowStyle(`
                    0 -10px 15px ${topColor1}, 
                    0 -15px 25px ${topColor2}, 
                    0 10px 15px ${bottomColor1}, 
                    0 15px 25px ${bottomColor2}, 
                    -10px 0 15px ${leftColor1}, 
                    -15px 0 25px ${leftColor2}, 
                    10px 0 15px ${rightColor1}, 
                    15px 0 25px ${rightColor2}
                `);
            } catch (error) {
                console.error("Lỗi khi trích xuất màu sắc:", error);
            }
        };
    }, [imageUrl]);
    return { imgRef, shadowStyle };
};

export default useImageBorderShadow;