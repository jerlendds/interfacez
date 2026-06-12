import type { Component } from "@interfacez/ui";
import { createModal, disposable, el, type ModalHandle } from "@interfacez/ui";

export const moodboardView: Component = {
  mount(root, scope) {
    const page = el("section", "nb-moodboard");
    page.tabIndex = 0;

    const header = el("header", "nb-moodboard__header");
    const heading = el("div", "nb-moodboard__heading");
    heading.append(
      el("h1", "", "Moodboard"),
      el(
        "p",
        "nb-moodboard__intro",
        "Collect reference images for the active space. Import image files or folders, or paste images from your clipboard directly into this page.",
      ),
    );

    const controls = el("div", "nb-moodboard__controls");
    const status = el("p", "nb-moodboard__status", "Paste images here.");
    const importImage = el(
      "button",
      "nb-moodboard__button",
      "Import image",
    ) as HTMLButtonElement;
    importImage.type = "button";
    importImage.dataset.moodboardAction = "import-image";

    const importFolder = el(
      "button",
      "nb-moodboard__button",
      "Import images folder",
    ) as HTMLButtonElement;
    importFolder.type = "button";
    importFolder.dataset.moodboardAction = "import-folder";
    controls.append(status, importImage, importFolder);
    header.append(heading, controls);

    const gallery = el("div", "nb-moodboard__gallery");
    page.append(header, gallery);
    root.replaceChildren(page);
    let preview: ModalHandle | undefined;

    const setStatus = (message: string) => {
      status.textContent = message;
    };

    const closePreview = () => {
      preview?.close();
    };

    const openPreview = (image: MoodboardImage) => {
      closePreview();
      const handle = createPreview(image, () => {
        if (preview === handle) preview = undefined;
        page.focus();
      });
      preview = handle;
      page.append(handle.element);
      handle.element.querySelector<HTMLButtonElement>(".nb-modal__close")?.focus();
    };

    const refresh = async () => {
      renderSkeletons(gallery);
      const images = await window.spaces.moodboardImages();
      renderGallery(gallery, images, openPreview);
      if (!images.length) setStatus("Paste images here.");
      else setStatus(`${images.length} image${images.length === 1 ? "" : "s"}`);
    };

    const importImages = async () => {
      try {
        setStatus("Importing images...");
        const imported = await window.spaces.importMoodboardImages();
        await refresh();
        if (imported.length) {
          setStatus(importedMessage("Imported", imported.length));
        }
      } catch (error) {
        setStatus(errorMessage(error));
      }
    };

    const importImagesFolder = async () => {
      try {
        setStatus("Importing folder...");
        const imported = await window.spaces.importMoodboardFolder();
        await refresh();
        if (imported.length) {
          setStatus(importedMessage("Imported", imported.length));
        }
      } catch (error) {
        setStatus(errorMessage(error));
      }
    };

    const pasteImages = async (event: ClipboardEvent) => {
      const files = imageFilesFromClipboard(event.clipboardData);
      if (!files.length) return;
      event.preventDefault();
      try {
        setStatus("Pasting images...");
        for (const file of files) {
          await window.spaces.pasteMoodboardImage({
            name: file.name,
            type: file.type,
            data: await file.arrayBuffer(),
          });
        }
        await refresh();
        setStatus(importedMessage("Pasted", files.length));
      } catch (error) {
        setStatus(errorMessage(error));
      }
    };

    const onClick = (event: Event) => {
      const button = (event.target as Element).closest<HTMLButtonElement>(
        "[data-moodboard-action]",
      );
      if (!button) return;
      const action = button.dataset.moodboardAction;
      if (action === "import-image") void importImages();
      if (action === "import-folder") void importImagesFolder();
    };

    page.addEventListener("click", onClick);
    page.addEventListener("paste", pasteImages);
    page.addEventListener("keydown", onKeyDown);
    scope.add(
      disposable(() => {
        page.removeEventListener("click", onClick);
        page.removeEventListener("paste", pasteImages);
        page.removeEventListener("keydown", onKeyDown);
        closePreview();
      }),
    );

    void refresh();
    window.setTimeout(() => page.focus(), 0);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && preview) {
        event.preventDefault();
        closePreview();
      }
    }
  },
};

function renderGallery(
  root: HTMLElement,
  images: MoodboardImage[],
  openPreview: (image: MoodboardImage) => void,
) {
  if (!images.length) {
    root.replaceChildren(el("p", "nb-moodboard__empty", "No images yet."));
    return;
  }

  root.replaceChildren(
    ...images.map((image) => {
      const figure = el("figure", "nb-moodboard__item");
      figure.tabIndex = 0;
      figure.setAttribute("role", "button");
      figure.setAttribute("aria-label", `Preview ${image.name}`);
      const img = el("img", "nb-moodboard__image") as HTMLImageElement;
      img.src = image.src;
      img.alt = image.name;
      img.draggable = false;
      img.loading = "lazy";
      img.decoding = "async";
      figure.append(img);
      figure.addEventListener("click", () => openPreview(image));
      figure.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openPreview(image);
      });
      return figure;
    }),
  );
}

function createPreview(image: MoodboardImage, close: () => void) {
  const state = { zoom: 1, panX: 0, panY: 0 };
  const shell = el("div", "nb-moodboard-preview");
  const toolbar = el("div", "nb-moodboard-preview__toolbar");
  const zoomOut = el("button", "nb-moodboard-preview__tool", "-");
  zoomOut.type = "button";
  zoomOut.setAttribute("aria-label", "Zoom out");
  const zoomValue = el("span", "nb-moodboard-preview__zoom", "100%");
  const zoomIn = el("button", "nb-moodboard-preview__tool", "+");
  zoomIn.type = "button";
  zoomIn.setAttribute("aria-label", "Zoom in");
  const resetZoom = el("button", "nb-moodboard-preview__tool", "Fit");
  resetZoom.type = "button";
  resetZoom.setAttribute("aria-label", "Reset zoom");
  toolbar.append(zoomOut, zoomValue, zoomIn, resetZoom);

  const viewport = el("div", "nb-moodboard-preview__viewport");
  const img = el("img", "nb-moodboard-preview__image") as HTMLImageElement;
  img.src = image.src;
  img.alt = image.name;
  img.decoding = "async";
  viewport.append(img);
  shell.append(toolbar, viewport);
  let panStart:
    | { pointerId: number; x: number; y: number; panX: number; panY: number }
    | undefined;

  const setZoom = (nextZoom: number) => {
    state.zoom = Math.min(4, Math.max(1, nextZoom));
    applyPreviewTransform(viewport, img, state);
    zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;
  };

  zoomOut.addEventListener("click", () => setZoom(state.zoom - 0.25));
  zoomIn.addEventListener("click", () => setZoom(state.zoom + 0.25));
  resetZoom.addEventListener("click", () => setZoom(1));
  viewport.addEventListener(
    "wheel",
    (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setZoom(state.zoom + (event.deltaY < 0 ? 0.15 : -0.15));
    },
    { passive: false },
  );
  viewport.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !canPanPreview(viewport, img, state)) return;
    event.preventDefault();
    panStart = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      panX: state.panX,
      panY: state.panY,
    };
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add("is-panning");
  });
  viewport.addEventListener("pointermove", (event) => {
    if (!panStart || event.pointerId !== panStart.pointerId) return;
    event.preventDefault();
    state.panX = panStart.panX + event.clientX - panStart.x;
    state.panY = panStart.panY + event.clientY - panStart.y;
    applyPreviewTransform(viewport, img, state);
  });
  const stopPanning = (event: PointerEvent) => {
    if (!panStart || event.pointerId !== panStart.pointerId) return;
    panStart = undefined;
    viewport.classList.remove("is-panning");
    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
  };
  viewport.addEventListener("pointerup", stopPanning);
  viewport.addEventListener("pointercancel", stopPanning);
  img.addEventListener("load", () => applyPreviewTransform(viewport, img, state));
  const observer = new ResizeObserver(() =>
    applyPreviewTransform(viewport, img, state),
  );
  observer.observe(viewport);
  setZoom(1);

  return createModal({
    variant: "bare",
    content: shell,
    closeLabel: "Close image preview",
    onClose() {
      observer.disconnect();
      close();
    },
  });
}

function canPanPreview(
  viewport: HTMLElement,
  img: HTMLImageElement,
  state: PreviewTransformState,
) {
  const bounds = previewPanBounds(viewport, img, state.zoom);
  return bounds.x > 0 || bounds.y > 0;
}

interface PreviewTransformState {
  zoom: number;
  panX: number;
  panY: number;
}

function applyPreviewTransform(
  viewport: HTMLElement,
  img: HTMLImageElement,
  state: PreviewTransformState,
) {
  if (!img.naturalWidth || !img.naturalHeight) {
    img.style.width = "";
    img.style.height = "";
    img.style.maxWidth = "";
    img.style.maxHeight = "";
    img.style.transform = "";
    return;
  }

  const fit = fittedImageSize(viewport, img);
  const bounds = previewPanBounds(viewport, img, state.zoom, fit);
  state.panX = clamp(state.panX, -bounds.x, bounds.x);
  state.panY = clamp(state.panY, -bounds.y, bounds.y);
  img.style.maxWidth = "none";
  img.style.maxHeight = "none";
  img.style.width = `${Math.round(fit.width)}px`;
  img.style.height = `${Math.round(fit.height)}px`;
  img.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
}

function previewPanBounds(
  viewport: HTMLElement,
  img: HTMLImageElement,
  zoom: number,
  fit = fittedImageSize(viewport, img),
) {
  return {
    x: Math.max(0, (fit.width * zoom - viewport.clientWidth) / 2),
    y: Math.max(0, (fit.height * zoom - viewport.clientHeight) / 2),
  };
}

function fittedImageSize(viewport: HTMLElement, img: HTMLImageElement) {
  const viewportWidth = Math.max(1, viewport.clientWidth);
  const viewportHeight = Math.max(1, viewport.clientHeight);
  const widthRatio = viewportWidth / img.naturalWidth;
  const heightRatio = viewportHeight / img.naturalHeight;
  const ratio = Math.min(widthRatio, heightRatio);
  return {
    width: img.naturalWidth * ratio,
    height: img.naturalHeight * ratio,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function renderSkeletons(root: HTMLElement) {
  root.replaceChildren(
    ...Array.from({ length: 12 }, () => {
      const skeleton = el("div", "nb-moodboard__skeleton");
      skeleton.setAttribute("aria-hidden", "true");
      return skeleton;
    }),
  );
}

function imageFilesFromClipboard(data: DataTransfer | null) {
  if (!data) return [];

  const files = [...data.files].filter((file) => file.type.startsWith("image/"));
  if (files.length) return files;

  return [...data.items]
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file));
}

function importedMessage(action: string, count: number) {
  return `${action} ${count} image${count === 1 ? "" : "s"}`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to update moodboard.";
}
