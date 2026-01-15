import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import JSZip from "jszip";

/**
 * Removes unsupported color functions (like oklch, oklab, color-mix) from the element and its children
 * replacing them with a safe fallback. This prevents html2canvas from crashing.
 */
/**
 * Removes unsupported color functions (like oklch, oklab, color-mix) from the element and its children
 * replacing them with a safe RGB fallback ensuring compatibility with html2canvas.
 */
export function sanitizeColors(element: HTMLElement) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT);

  // Create a shared helper canvas for color conversion
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  const convertToRgb = (color: string): string => {
    if (!color || color === "transparent" || color === "inherit") return color;

    // If it's already safe, return it (optimization)
    if (!color.includes("oklch") && !color.includes("oklab") && !color.includes("hwb") && !color.includes("color-mix")) {
      return color;
    }

    if (!ctx) return "transparent"; // Fallback to transparent if no canvas available

    // First attempt: let the browser compute via a temporary element (safer on some engines)
    try {
      const temp = document.createElement("div");
      temp.style.position = "fixed";
      temp.style.left = "-9999px";
      temp.style.width = "1px";
      temp.style.height = "1px";
      temp.style.background = color;
      document.body.appendChild(temp);
      const computed = window.getComputedStyle(temp).backgroundColor;
      document.body.removeChild(temp);
      if (computed && (computed.startsWith("rgb") || computed.startsWith("rgba"))) {
        return computed;
      }
    } catch (e) {
      // ignore and try canvas fallback
    }

    // Fallback: try drawing on canvas (may throw for unsupported color functions)
    try {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    } catch (e) {
      // As a last resort return transparent to avoid crashes
      console.warn("Could not convert advanced color to rgb:", color, e);
      return "transparent";
    }
  };

  // Process root element first
  const processElement = (el: HTMLElement) => {
    const style = window.getComputedStyle(el);
    // Helper regexes
    const unsafeTokenRegex = /oklch|oklab|hwb|color-mix|lab/i;
    const funcRegex = /(oklch|oklab|hwb|color-mix|lab)\([^)]*\)/gi;

    const replaceFuncsInString = (s: string) => {
      if (!s) return s;
      return s.replace(funcRegex, (match) => {
        try {
          return convertToRgb(match);
        } catch (e) {
          return "transparent";
        }
      });
    };

    // Convert simple color properties
    try {
      if (style.backgroundColor && unsafeTokenRegex.test(style.backgroundColor)) {
        el.style.backgroundColor = convertToRgb(style.backgroundColor);
      }
    } catch (e) {
      el.style.backgroundColor = "transparent";
    }

    try {
      if (style.color && unsafeTokenRegex.test(style.color)) {
        el.style.color = convertToRgb(style.color);
      }
    } catch (e) {
      el.style.color = "inherit";
    }

    // Border colors
    try {
      [
        "borderColor",
        "borderTopColor",
        "borderRightColor",
        "borderBottomColor",
        "borderLeftColor",
        "outlineColor",
        "textDecorationColor",
        "columnRuleColor",
        "caretColor",
      ].forEach((prop) => {
        const val = (style as any)[prop];
        if (val && unsafeTokenRegex.test(val)) {
          try {
            (el.style as any)[prop] = convertToRgb(val);
          } catch (e) {
            (el.style as any)[prop] = "transparent";
          }
        }
      });
    } catch (e) {
      // ignore
    }

    // Shadows (may contain color functions inside)
    try {
      if (style.boxShadow && unsafeTokenRegex.test(style.boxShadow)) {
        el.style.boxShadow = replaceFuncsInString(style.boxShadow);
      }
    } catch (e) {
      el.style.boxShadow = "none";
    }
    try {
      if (style.textShadow && unsafeTokenRegex.test(style.textShadow)) {
        el.style.textShadow = replaceFuncsInString(style.textShadow);
      }
    } catch (e) {
      el.style.textShadow = "none";
    }

    // Background / gradients: try to replace functions, otherwise fallback to plain backgroundColor
    try {
      if ((style.background && unsafeTokenRegex.test(style.background)) || (style.backgroundImage && unsafeTokenRegex.test(style.backgroundImage))) {
        // attempt safe replacement inside the background string
        const attempted = replaceFuncsInString(style.background || style.backgroundImage || "");
        // If replacement yields something without unsafe tokens, use it; else fallback
        if (attempted && !unsafeTokenRegex.test(attempted)) {
          el.style.background = attempted;
        } else {
          el.style.backgroundImage = "none";
          el.style.backgroundColor = convertToRgb(style.backgroundColor || style.background || "transparent");
        }
      }
    } catch (e) {
      el.style.backgroundImage = "none";
      el.style.backgroundColor = "transparent";
    }
  };

  processElement(element);

  while (walker.nextNode()) {
    processElement(walker.currentNode as HTMLElement);
  }
}

/**
 * Exports a single badge node to PNG blob
 */
export async function generateBadgeImage(node: HTMLElement): Promise<Blob | null> {
  // Get original dimensions (Unscaled natural size)
  let width = node.offsetWidth;
  let height = node.offsetHeight;

  // Fallback for some edge cases
  if (width === 0 || height === 0) {
    const rect = node.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
  }

  // Clone to avoid modifying the visible DOM during sanitization
  const clone = node.cloneNode(true) as HTMLElement;
const imgs = clone.querySelectorAll("img");
imgs.forEach((img) => {
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "contain";
  img.style.display = "block";
});
  // Important: ensure the clone is visible for rendering but doesn't affect layout
  // We use the explicit dimensions from the original node
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.margin = "0";
  clone.style.padding = "0";
  clone.style.transform = "none";
  clone.style.position = "fixed"; // Fixed is safer than absolute for viewport positioning
  clone.style.left = "0";      // Bring it on-screen
  clone.style.top = "0";       // Bring it on-screen
  clone.style.zIndex = "-9999"; // Hide it behind everything
  clone.style.visibility = "visible";
  clone.style.display = "block";
  document.body.appendChild(clone);

  try {
    // Wait for images to load in the clone
    const images = Array.from(clone.querySelectorAll("img"));
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>(resolve => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    }));

    // Sanitize modern CSS colors to prevent html2canvas crash
    sanitizeColors(clone);

    const canvas = await html2canvas(clone, {
      backgroundColor: null, // Transparent background
      scale: window.devicePixelRatio || 2, // Reduced slightly for stability, still high quality (approx 300DPI)
      useCORS: true,
      logging: false,
      allowTaint: true,
      scrollX: 0,
      scrollY: 0,
      width: width, // Explicit render width
      height: height // Explicit render height
    } as any);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
    });
  } catch (e) {
    console.error("Erreur html2canvas:", e);
    return null;
  } finally {
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }
  }
}

/**
 * Exports multiple badges as a multi-page PDF Grid
 */
export async function exportBadgesAsPdf(
  badgeNodes: HTMLElement[],
  fileNames: string[],
  onProgress: (p: number) => void
) {
  const pdf = new jsPDF("p", "mm", "a4");
  const margin = 10;

  // Detect orientation from first node (using unscaled offset dimensions)
  let isPortrait = true;
  if (badgeNodes.length > 0) {
    const w = badgeNodes[0].offsetWidth;
    const h = badgeNodes[0].offsetHeight;
    isPortrait = h > w;
    // Default fallback if offsets are 0 (e.g. hidden)
    if (w === 0 || h === 0) {
      const rect = badgeNodes[0].getBoundingClientRect();
      isPortrait = rect.height > rect.width;
    }
  }

  const cardWidth = isPortrait ? 54 : 86;
  const cardHeight = isPortrait ? 86 : 54;

  // Calculate centering
  // We can fit floor( (210 - 2*margin) / (cardWidth + gap) )
  // But let's stick to the grid we have.
  // 3 columns of 54 fits: 54*3 + 5*2 = 162 + 10 = 172. 210-172 = 38. 19mm margins.
  // 2 columns of 86 fits: 86*2 + 5 = 172 + 5 = 177. 210-177 = 33. 16.5mm margins.

  // Dynamic columns calculation
  const pageWidth = 210;
  const pageHeight = 297;
  const gap = 5; // mm

  // How many cols fit?
  const cols = Math.floor((pageWidth - (margin * 2) + gap) / (cardWidth + gap));

  // Calculate content width to center it
  const totalContentWidth = (cols * cardWidth) + ((cols - 1) * gap);
  const startX = (pageWidth - totalContentWidth) / 2;

  let x = startX;
  let y = margin;

  let colIndex = 0;

  for (let i = 0; i < badgeNodes.length; i++) {
    // Yield to UI
    await new Promise(r => setTimeout(r, 60));

    const node = badgeNodes[i];
    const blob = await generateBadgeImage(node);

    if (blob) {
      const reader = new FileReader();
      const base64data = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      // New Page Check
      if (y + cardHeight > pageHeight - margin) {
        pdf.addPage();
        x = startX;
        y = margin;
        colIndex = 0;
      }

      pdf.addImage(base64data, "PNG", x, y, cardWidth, cardHeight);

      // Move right
      colIndex++;
      x += cardWidth + gap;

      // Wrap
      if (colIndex >= cols) {
        x = startX;
        y += cardHeight + gap;
        colIndex = 0;
      }
    }

    onProgress((i + 1) / badgeNodes.length);
  }

  pdf.save(`badges-print_${new Date().getTime()}.pdf`);
}

/**
 * Downloads badges as individual PNG images
 */
export async function exportBadgesAsImages(
  badgeNodes: HTMLElement[],
  fileNames: string[],
  onProgress: (p: number) => void
) {
  // If only one image requested, keep single-download behavior
  if (badgeNodes.length === 1) {
    const blob = await generateBadgeImage(badgeNodes[0]);
    if (blob) {
      downloadBlob(blob, fileNames[0] || `badge-0.png`);
    }
    onProgress(1);
    return;
  }

  // For multiple images: bundle into a ZIP to avoid browser multiple-download blocking
  const zip = new JSZip();
  let completed = 0;

  for (let i = 0; i < badgeNodes.length; i++) {
    // Yield to UI
    await new Promise(r => setTimeout(r, 80));

    const node = badgeNodes[i];
    const filename = fileNames[i] || `badge-${i}.png`;

    try {
      const blob = await generateBadgeImage(node);
      if (blob) {
        zip.file(filename, blob);
      }
    } catch (e) {
      console.error(`Erreur génération image ${filename}:`, e);
    }

    completed++;
    onProgress(completed / badgeNodes.length);
  }

  try {
    const zipBlob = await zip.generateAsync({ type: "blob" });
    downloadBlob(zipBlob, `badges_images_${new Date().getTime()}.zip`);
  } catch (e) {
    console.error("Erreur génération ZIP:", e);
    alert("Erreur lors de la création du fichier ZIP.");
  }
}

// Backward compatibility or alias
export const exportBadgesAsZip = exportBadgesAsPdf;


/**
 * Helper to download a single blob
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revoke after a short delay to ensure download started in all browsers
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
