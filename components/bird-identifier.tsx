"use client";

import {
  type ChangeEvent,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
  type Crop,
  type PercentCrop,
  type PixelCrop,
} from "react-image-crop";

import "react-image-crop/dist/ReactCrop.css";

import {
  PredictionResults,
  type RequestState,
} from "@/components/prediction-results";
import { cropImage } from "@/lib/crop-image";
import { parsePredictions, type Prediction } from "@/lib/predictions";

const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function getInitialCrop(width: number, height: number): PercentCrop {
  if (width >= height) {
    return centerCrop(
      makeAspectCrop({ unit: "%", height: 82 }, 1, width, height),
      width,
      height,
    );
  }

  return centerCrop(
    makeAspectCrop({ unit: "%", width: 82 }, 1, width, height),
    width,
    height,
  );
}

function getRequestError(status: number): string {
  switch (status) {
    case 400:
      return "Birdly could not process this crop. Adjust the crop or choose another image.";
    case 413:
      return "This crop is too large. Select a smaller area or choose a smaller image.";
    case 429:
      return "Birdly has received too many requests. Wait one minute and try again.";
    case 503:
      return "Birdly is temporarily unavailable. Try again in a moment.";
    default:
      return "Birdly could not identify this image. Try again.";
  }
}

export function BirdIdentifier() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [cropBlob, setCropBlob] = useState<Blob | null>(null);
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string | null>(null);
  const [cropError, setCropError] = useState<string | null>(null);
  const [isPreparingCrop, setIsPreparingCrop] = useState(false);
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isTakingLonger, setIsTakingLonger] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceUrlRef = useRef<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const cropGenerationRef = useRef(0);

  const replaceSourceUrl = useCallback((nextUrl: string | null) => {
    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
    }
    sourceUrlRef.current = nextUrl;
    setImageUrl(nextUrl);
  }, []);

  const replacePreviewUrl = useCallback((nextUrl: string | null) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    previewUrlRef.current = nextUrl;
    setCropPreviewUrl(nextUrl);
  }, []);

  useEffect(() => {
    return () => {
      if (sourceUrlRef.current) {
        URL.revokeObjectURL(sourceUrlRef.current);
      }
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const clearResult = useCallback(() => {
    setPredictions([]);
    setRequestError(null);
    setRequestState("idle");
    setIsTakingLonger(false);
  }, []);

  const generateCrop = useCallback(
    async (completedCrop: PixelCrop) => {
      const image = imageRef.current;
      if (!image || completedCrop.width <= 0 || completedCrop.height <= 0) {
        return;
      }

      const generation = cropGenerationRef.current + 1;
      cropGenerationRef.current = generation;
      setIsPreparingCrop(true);
      setCropError(null);

      try {
        const blob = await cropImage(image, completedCrop);
        if (generation !== cropGenerationRef.current) {
          return;
        }
        setCropBlob(blob);
        replacePreviewUrl(URL.createObjectURL(blob));
      } catch {
        if (generation !== cropGenerationRef.current) {
          return;
        }
        setCropBlob(null);
        replacePreviewUrl(null);
        setCropError(
          "Birdly could not prepare this crop. Adjust the crop or choose another image.",
        );
      } finally {
        if (generation === cropGenerationRef.current) {
          setIsPreparingCrop(false);
        }
      }
    },
    [replacePreviewUrl],
  );

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    clearResult();
    setCropError(null);

    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      replaceSourceUrl(null);
      replacePreviewUrl(null);
      setCropBlob(null);
      setCrop(undefined);
      setFileName("");
      setCropError("Choose a JPEG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    cropGenerationRef.current += 1;
    setCropBlob(null);
    replacePreviewUrl(null);
    setCrop(undefined);
    setFileName(file.name);
    replaceSourceUrl(URL.createObjectURL(file));
  }

  function handleImageLoad(event: SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;
    const initialCrop = getInitialCrop(image.width, image.height);
    setCrop(initialCrop);
    void generateCrop(
      convertToPixelCrop(initialCrop, image.width, image.height),
    );
  }

  function handleCropChange(pixelCrop: PixelCrop, percentCrop: PercentCrop) {
    setCrop(percentCrop);
    setIsPreparingCrop(true);
    setCropBlob(null);
    clearResult();

    if (pixelCrop.width <= 0 || pixelCrop.height <= 0) {
      replacePreviewUrl(null);
    }
  }

  async function identifyBird() {
    if (!cropBlob || requestState === "loading") {
      return;
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_BIRDLY_API_URL?.trim();
    if (!apiBaseUrl) {
      setRequestState("error");
      setRequestError("Identification is not available. Try again later.");
      return;
    }

    setRequestState("loading");
    setRequestError(null);
    setPredictions([]);
    setIsTakingLonger(false);

    const slowRequestTimer = window.setTimeout(() => {
      setIsTakingLonger(true);
    }, 5000);

    try {
      const formData = new FormData();
      formData.append("image", cropBlob, "birdly-crop.jpg");

      const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/predict`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        setRequestState("error");
        setRequestError(getRequestError(response.status));
        return;
      }

      const responseBody: unknown = await response.json();
      const returnedPredictions = parsePredictions(responseBody);
      if (returnedPredictions === null) {
        setRequestState("error");
        setRequestError("Birdly returned an invalid result. Try again.");
        return;
      }

      setPredictions(returnedPredictions);
      setRequestState("success");
    } catch {
      setRequestState("error");
      setRequestError(
        "Birdly could not connect. Check your connection and try again.",
      );
    } finally {
      window.clearTimeout(slowRequestTimer);
      setIsTakingLonger(false);
    }
  }

  const hasImage = imageUrl !== null;
  const canIdentify =
    cropBlob !== null && !isPreparingCrop && requestState !== "loading";

  return (
    <section
      id="main-workspace"
      className="workspace"
      aria-label="Bird identification workspace"
    >
      <div className="workspace-header">
        <div>
          <h2>{hasImage ? "Adjust the crop" : "Choose a photograph"}</h2>
          <p>
            {hasImage
              ? "Move or resize the square so the bird fills most of it."
              : "Use a clear JPEG, PNG, or WebP photograph."}
          </p>
        </div>

        <div className="file-actions">
          <label
            className={hasImage ? "text-button" : "upload-button"}
            htmlFor="bird-image"
          >
            {hasImage ? "Replace image" : "Choose image"}
          </label>
          <input
            ref={fileInputRef}
            id="bird-image"
            className="visually-hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {fileName && <p className="file-name">Selected: {fileName}</p>}

      {!hasImage && (
        <button
          className="empty-workspace"
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="empty-workspace-title">
            Select a bird photograph
          </span>
          <span>JPEG, PNG, or WebP</span>
        </button>
      )}

      {hasImage && (
        <div className="crop-layout">
          <div className="crop-editor" aria-label="Interactive square crop">
            <ReactCrop
              crop={crop}
              aspect={1}
              minWidth={72}
              keepSelection
              onChange={handleCropChange}
              onComplete={(completedCrop) => void generateCrop(completedCrop)}
            >
              {/* The source image stays in the browser. Only the generated crop is uploaded. */}
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Selected bird photograph. Use the square boundary to select the bird."
                onLoad={handleImageLoad}
              />
            </ReactCrop>
          </div>

          <aside className="crop-summary" aria-labelledby="crop-preview-title">
            <h3 id="crop-preview-title">Selected crop</h3>
            <div className="crop-preview">
              {cropPreviewUrl ? (
                <img
                  src={cropPreviewUrl}
                  alt="Preview of the square crop that Birdly will identify"
                />
              ) : (
                <span>
                  {isPreparingCrop ? "Preparing crop…" : "Crop preview"}
                </span>
              )}
            </div>
            <p>Only this square image will be sent.</p>

            <button
              className="identify-button"
              type="button"
              disabled={!canIdentify}
              onClick={() => void identifyBird()}
            >
              {requestState === "loading" ? "Identifying…" : "Identify"}
            </button>

            {isTakingLonger && requestState === "loading" && (
              <p className="request-note" role="status">
                Still identifying. The first result can take a little longer.
              </p>
            )}
          </aside>
        </div>
      )}

      <div className="status-region" aria-live="polite">
        {cropError && <p className="error-message">{cropError}</p>}
        {requestError && <p className="error-message">{requestError}</p>}
      </div>

      <PredictionResults
        predictions={predictions}
        requestState={requestState}
      />
    </section>
  );
}
