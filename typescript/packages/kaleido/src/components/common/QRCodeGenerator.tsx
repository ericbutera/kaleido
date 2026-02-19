import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

interface QRCodeGeneratorProps {
  id?: string;
  value: string;
  size?: number;
  level?: "L" | "M" | "Q" | "H";
  filenameBase?: string;
  showDownloads?: boolean;
}

const downloadSVGById = (id: string, filenameBase = "qr-code", scale = 4) => {
  const svg = document.getElementById(id) as SVGSVGElement | null;
  if (!svg) return;

  let svgData = new XMLSerializer().serializeToString(svg);
  if (!svgData.includes("xmlns=")) {
    svgData = svgData.replace(
      /<svg(\s+)/,
      '<svg xmlns="http://www.w3.org/2000/svg" ',
    );
  }

  const origWidth = svg.getAttribute("width")
    ? parseInt(svg.getAttribute("width")!, 10)
    : svg.clientWidth || 200;
  const origHeight = svg.getAttribute("height")
    ? parseInt(svg.getAttribute("height")!, 10)
    : svg.clientHeight || origWidth;

  const outWidth = Math.round(origWidth * scale);
  const outHeight = Math.round(origHeight * scale);

  if (!/viewBox=/.test(svgData)) {
    svgData = svgData.replace(
      /<svg(\s+)/,
      `<svg viewBox="0 0 ${origWidth} ${origHeight}" `,
    );
  }

  if (/width="[^"]*"/.test(svgData)) {
    svgData = svgData.replace(/width="[^"]*"/, `width="${outWidth}"`);
  } else {
    svgData = svgData.replace(/<svg(\s+)/, `<svg width="${outWidth}" `);
  }

  if (/height="[^"]*"/.test(svgData)) {
    svgData = svgData.replace(/height="[^"]*"/, `height="${outHeight}"`);
  } else {
    svgData = svgData.replace(/<svg(\s+)/, `<svg height="${outHeight}" `);
  }

  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext("2d");

  const img = new Image();
  img.onload = () => {
    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
    const pngFile = canvas.toDataURL("image/png");

    const downloadLink = document.createElement("a");
    downloadLink.download = `${filenameBase}.png`;
    downloadLink.href = pngFile;
    downloadLink.click();
  };

  img.src =
    "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
};

export default function QRCodeGenerator({
  id = "qr-code",
  value,
  size = 200,
  level = "H",
  filenameBase,
  showDownloads = true,
}: QRCodeGeneratorProps) {
  const fileBase =
    filenameBase ||
    value.replace(/[^a-z0-9_-]/gi, "-").slice(0, 40) ||
    "qr-code";

  return (
    <div className="flex flex-col items-start ">
      <div className="bg-base-100 p-4 rounded-lg">
        <QRCodeSVG id={id} value={value} size={size} level={level} />
      </div>

      {showDownloads && (
        <div className="join justify-center self-center">
          <ScaleDownload id={id} fileBase={fileBase} />
        </div>
      )}
    </div>
  );
}

function ScaleDownload({ id, fileBase }: { id: string; fileBase: string }) {
  const [scale, setScale] = useState<number>(8);

  const labelForScale = (s: number) =>
    s === 8 ? "large" : s === 4 ? "medium" : "small";

  return (
    <>
      <select
        className="select join-item"
        value={String(scale)}
        onChange={(e) => setScale(Number(e.target.value))}
        aria-label="Download scale"
      >
        <option value={8}>Large</option>
        <option value={4}>Medium</option>
        <option value={2}>Small</option>
      </select>

      <button
        className="btn btn-secondary join-item"
        onClick={() =>
          downloadSVGById(id, `${fileBase}-${labelForScale(scale)}`, scale)
        }
        title={`Download ${scale}x`}
      >
        Download
      </button>
    </>
  );
}
