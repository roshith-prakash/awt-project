// src/pdfWorker.ts
import { pdfjs } from "react-pdf";
import workerSrc from "pdfjs-dist/build/pdf.worker?url";

// Important: we manually set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
