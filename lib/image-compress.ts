/** 長辺をこのピクセル数までに縮小する */
const MAX_EDGE = 1280;
/** Firestore の 1 ドキュメント上限（約1MB）に余裕を持たせた data URL の最大文字数 */
const MAX_DATA_URL_LENGTH = 700_000;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像を読み込めませんでした"));
    };
    img.src = url;
  });
}

/**
 * 画像ファイルを縮小・JPEG 圧縮して data URL にする。
 * Firestore に直接保存できるサイズに収まるまで、画質と解像度を段階的に下げる。
 */
export async function compressImageToDataUrl(file: File): Promise<string> {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("画像を処理できませんでした");

  let edge = MAX_EDGE;
  while (edge >= 320) {
    const scale = Math.min(1, edge / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    // 透過 PNG が JPEG 化で黒くならないよう白で塗っておく
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.8, 0.7, 0.6, 0.5]) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= MAX_DATA_URL_LENGTH) return dataUrl;
    }
    edge = Math.round(edge * 0.75);
  }
  throw new Error("画像を十分に小さくできませんでした");
}
