import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductController } from "../../../controllers";
import {
  PRODUCT_CATEGORY_OPTIONS,
  normalizeProductCategory,
} from "../../../constants/productCategories";
import {
  ArrowLeft,
  Copy,
  Download,
  FileSpreadsheet,
  FilePlus2,
  FolderOpen,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";

const CSV_COLUMNS = [
  { key: "title", label: "Title", placeholder: "Baby Bottle Set" },
  { key: "price", label: "Price", placeholder: "24.99" },
  { key: "discountPrice", label: "Discount Price", placeholder: "19.99" },
  { key: "category", label: "Category", placeholder: "Select a category" },
  { key: "description", label: "Description", placeholder: "Soft silicone baby bottle set" },
  { key: "stock", label: "Stock", placeholder: "30" },
  {
    key: "image",
    label: "Image URL",
    placeholder: "https://example.com/images/product.jpg",
  },
];

const CSV_HEADER_ALIASES = {
  discountprice: "discountPrice",
};

const createEmptyRow = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: "",
  price: "",
  discountPrice: "",
  category: "",
  description: "",
  stock: "",
  image: "",
  imageName: "",
  imageUploading: false,
});

const escapeCsvValue = (value = "") => {
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const normalizeCsvHeader = (header = "") =>
  {
    const normalizedHeader = header
      .trim()
      .replace(/^\uFEFF/, "")
      .toLowerCase()
      .replace(/[\s_-]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ""));

    return CSV_HEADER_ALIASES[normalizedHeader] || normalizedHeader;
  };

const parseCsvLine = (line = "") => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values.map((value) => value.trim());
};

const parseCsvContent = (content = "") => {
  const lines = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map(normalizeCsvHeader);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const record = {};

    headers.forEach((header, columnIndex) => {
      record[header] = values[columnIndex] ?? "";
    });

    return record;
  });
};

const getImageNameFromValue = (imageValue = "") => {
  try {
    if (!imageValue) return "";
    const pathname = new URL(imageValue).pathname;
    return decodeURIComponent(pathname.split("/").pop() || "");
  } catch {
    return "";
  }
};

const sanitizeFileName = (fileName = "") => {
  const sanitized = String(fileName || "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-");

  if (!sanitized) {
    return "products-import-ready.csv";
  }

  return sanitized.toLowerCase().endsWith(".csv")
    ? sanitized
    : `${sanitized}.csv`;
};

const mapDraftRow = (row = {}) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: row.title || "",
  price: row.price || "",
  discountPrice: row.discountPrice || "",
  category: normalizeProductCategory(row.category),
  description: row.description || "",
  stock: row.stock || "",
  image: row.image || "",
  imageName: row.imageName || "",
  imageUploading: false,
});

const buildDraftPayload = (rows = []) =>
  rows.map(({ title, price, discountPrice, category, description, stock, image, imageName }) => ({
    title,
    price,
    discountPrice,
    category,
    description,
    stock,
    image,
    imageName,
  }));

const autoResizeTextarea = (element) => {
  if (!element) {
    return;
  }

  element.style.height = "0px";
  element.style.height = `${element.scrollHeight}px`;
};

const CsvBuilder = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([createEmptyRow()]);
  const [fileName, setFileName] = useState("products-import-ready.csv");
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isApplyingProducts, setIsApplyingProducts] = useState(false);
  const [draftStatus, setDraftStatus] = useState("Loading saved draft...");
  const fileInputRefs = useRef({});
  const csvFilePickerRef = useRef(null);
  const hasLoadedDraftRef = useRef(false);
  const lastSavedSnapshotRef = useRef("");

  const updateRow = (rowId, field, value) => {
    setRows((currentRows) =>
      currentRows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  const insertRowAfter = (rowId) => {
    setRows((currentRows) => {
      const index = currentRows.findIndex((item) => item.id === rowId);
      if (index === -1) return currentRows;

      return [
        ...currentRows.slice(0, index + 1),
        createEmptyRow(),
        ...currentRows.slice(index + 1),
      ];
    });
  };

  const removeRow = (rowId) => {
    setRows((currentRows) => {
      if (currentRows.length === 1) {
        return [createEmptyRow()];
      }

      return currentRows.filter((row) => row.id !== rowId);
    });
  };

  const triggerImagePicker = (rowId) => {
    fileInputRefs.current[rowId]?.click();
  };

  const setRowUploadState = (rowId, imageUploading) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId ? { ...row, imageUploading } : row
      )
    );
  };

  const handleImageUpload = async (rowId, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    setRowUploadState(rowId, true);

    try {
      const response = await ProductController.uploadImage(formData);
      const imageUrl = response.data?.imageUrl || "";

      setRows((currentRows) =>
        currentRows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                image: imageUrl,
                imageName: file.name,
                imageUploading: false,
              }
            : row
        )
      );
    } catch (error) {
      console.error("Failed to upload image", error);
      alert(
        error.response?.data?.message || error.message || "Failed to upload image"
      );
      setRowUploadState(rowId, false);
    }
  };

  const clearUploadedImage = (rowId) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? { ...row, image: "", imageName: "", imageUploading: false }
          : row
      )
    );

    if (fileInputRefs.current[rowId]) {
      fileInputRefs.current[rowId].value = "";
    }
  };

  const csvContent = useMemo(() => {
    const header = CSV_COLUMNS.map((column) => column.key).join(",");
    const dataLines = rows
      .filter((row) =>
        CSV_COLUMNS.some((column) => String(row[column.key] || "").trim() !== "")
      )
      .map((row) =>
        CSV_COLUMNS.map((column) => escapeCsvValue(row[column.key] || "")).join(",")
      );

    return [header, ...dataLines].join("\n");
  }, [rows]);

  const filledRowsCount = useMemo(
    () =>
      rows.filter((row) =>
        CSV_COLUMNS.some((column) => String(row[column.key] || "").trim() !== "")
      ).length,
    [rows]
  );

  const copyImageUrl = async (rowId, imageUrl) => {
    if (!imageUrl.trim()) return;

    try {
      await navigator.clipboard.writeText(imageUrl);
    } catch (error) {
      console.error("Failed to copy image URL", error);
      alert("Failed to copy image URL");
    }
  };

  const downloadCsv = () => {
    const suggestedFileName = sanitizeFileName(fileName);
    const providedFileName = window.prompt(
      "Enter a file name for this CSV export",
      suggestedFileName
    );

    if (providedFileName === null) {
      return;
    }

    const nextFileName = sanitizeFileName(providedFileName);
    setFileName(nextFileName);

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nextFileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const applyToProducts = async () => {
    if (filledRowsCount === 0) {
      alert("Add at least one product row before applying to products");
      return;
    }

    const formData = new FormData();
    const csvFile = new File([csvContent], sanitizeFileName(fileName), {
      type: "text/csv;charset=utf-8;",
    });
    formData.append("file", csvFile);

    try {
      setIsApplyingProducts(true);
      const response = await ProductController.upsertCsv(formData);
      alert(
        response.data?.message
          ? `${response.data.message}\nUpdated: ${response.data.updatedCount || 0}\nCreated: ${response.data.createdCount || 0}`
          : "Products applied successfully"
      );
      navigate("/admin/products");
    } catch (error) {
      console.error("Failed to apply CSV builder rows to products", error);
      const message =
        error.response?.data?.errors?.join("\n") ||
        error.response?.data?.message ||
        error.message ||
        "Failed to apply products";
      alert(message);
    } finally {
      setIsApplyingProducts(false);
    }
  };

  const createNewFile = () => {
    const shouldReset = window.confirm(
      "Create a new sheet? This will replace the current table with a blank file."
    );

    if (!shouldReset) return;

    setRows([createEmptyRow()]);
    setFileName("products-import-ready.csv");
    setDraftStatus("New file created");
  };

  const openFilePicker = () => {
    csvFilePickerRef.current?.click();
  };

  const openCsvFile = async (file) => {
    if (!file) return;

    try {
      const content = await file.text();
      const parsedRows = parseCsvContent(content).map((row) =>
        mapDraftRow({
          title: row.title,
          price: row.price,
          discountPrice: row.discountPrice,
          category: row.category,
          description: row.description,
          stock: row.stock,
          image: row.image,
          imageName: getImageNameFromValue(row.image),
        })
      );

      setRows(parsedRows.length > 0 ? parsedRows : [createEmptyRow()]);
      setFileName(sanitizeFileName(file.name || "products-import-ready.csv"));
      setDraftStatus("CSV file opened");
    } catch (error) {
      console.error("Failed to open CSV file", error);
      alert("Failed to open CSV file");
    }

    if (csvFilePickerRef.current) {
      csvFilePickerRef.current.value = "";
    }
  };

  useEffect(() => {
    const loadDraft = async () => {
      try {
        setIsLoadingDraft(true);
        const response = await ProductController.getCsvDraft();
        const savedRows = Array.isArray(response.data?.rows) ? response.data.rows : [];
        const nextRows = savedRows.length > 0 ? savedRows.map(mapDraftRow) : [createEmptyRow()];
        setRows(nextRows);
        setFileName(sanitizeFileName(response.data?.fileName || "products-import-ready.csv"));
        lastSavedSnapshotRef.current = JSON.stringify({
          rows: buildDraftPayload(nextRows),
          fileName: sanitizeFileName(response.data?.fileName || "products-import-ready.csv"),
        });
        setDraftStatus(savedRows.length > 0 ? "Saved draft loaded" : "No saved draft yet");
      } catch (error) {
        console.error("Failed to load CSV builder draft", error);
        setDraftStatus("Could not load saved draft");
      } finally {
        hasLoadedDraftRef.current = true;
        setIsLoadingDraft(false);
      }
    };

    loadDraft();
  }, []);

  useEffect(() => {
    if (!hasLoadedDraftRef.current || isLoadingDraft) {
      return undefined;
    }

    const payload = {
      rows: buildDraftPayload(rows),
      fileName: sanitizeFileName(fileName),
    };
    const serializedPayload = JSON.stringify(payload);

    if (serializedPayload === lastSavedSnapshotRef.current) {
      return undefined;
    }

    setDraftStatus("Saving draft...");
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSavingDraft(true);
        await ProductController.saveCsvDraft(payload);
        lastSavedSnapshotRef.current = serializedPayload;
        setDraftStatus("Draft saved to database");
      } catch (error) {
        console.error("Failed to save CSV builder draft", error);
        setDraftStatus("Draft save failed");
      } finally {
        setIsSavingDraft(false);
      }
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [rows, fileName, isLoadingDraft]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="border-b border-gray-200 bg-white shadow-lg">
        <div className="flex w-full items-center gap-4 px-4 py-6 sm:px-6 xl:px-8">
          <button
            className="group rounded-xl p-3 transition-all duration-200 hover:bg-gray-100"
            onClick={() => navigate("/admin/products")}
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text-main)]">
              Product CSV Builder
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Open a CSV file, edit it like a sheet, create a new file, and save it back out.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              {isSavingDraft || isLoadingDraft ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>{draftStatus}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-8 sm:px-6 xl:px-8">
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
            <p className="text-sm font-medium text-gray-600">Prepared Rows</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{filledRowsCount}</p>
            <p className="mt-2 text-sm text-gray-500">Rows saved in your working draft</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
            <p className="text-sm font-medium text-gray-600">CSV Columns</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{CSV_COLUMNS.length}</p>
            <p className="mt-2 text-sm text-gray-500">
              Matches your existing product import format
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
            <p className="text-sm font-medium text-gray-600">Image URL Shortcut</p>
            <p className="mt-2 text-lg font-bold text-gray-900">Copy per row</p>
            <p className="mt-2 text-sm text-gray-500">
              Use the copy button to paste URLs directly into other files
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="flex items-center text-xl font-bold text-gray-900">
                <FileSpreadsheet className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
                Build Your Import Table
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Work on this like a simple spreadsheet. Open an existing CSV file, create
                a new one, edit cells directly, and save the current sheet back to CSV.
              </p>
              <p className="mt-4 text-xs text-gray-500">
                The export file name is entered after you click <span className="font-semibold">Save File</span>.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <input
                ref={csvFilePickerRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => openCsvFile(event.target.files?.[0])}
                className="hidden"
              />
              <button
                type="button"
                onClick={createNewFile}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-5 py-3 font-semibold text-[var(--color-primary)] shadow-sm transition-all duration-200 hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-soft)]"
              >
                <FilePlus2 className="h-4 w-4" />
                <span>New File</span>
              </button>
              <button
                type="button"
                onClick={openFilePicker}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-5 py-3 font-semibold text-[var(--color-primary)] shadow-sm transition-all duration-200 hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-soft)]"
              >
                <FolderOpen className="h-4 w-4" />
                <span>Open File</span>
              </button>
              <button
                type="button"
                onClick={applyToProducts}
                disabled={isApplyingProducts || filledRowsCount === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-primary)] bg-white px-5 py-3 font-semibold text-[var(--color-primary)] shadow-sm transition-all duration-200 hover:bg-[var(--color-surface-soft)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isApplyingProducts ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                <span>{isApplyingProducts ? "Applying..." : "Apply to Products"}</span>
              </button>
              <button
                type="button"
                onClick={downloadCsv}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:bg-[var(--color-primary-dark)]"
              >
                <Download className="h-4 w-4" />
                <span>Save File</span>
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="rounded-l-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    #
                  </th>
                  {CSV_COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className={`border border-gray-200 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${
                        column.key === "description" ? "min-w-[420px]" : ""
                      }`}
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="rounded-r-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td className="border border-gray-200 bg-white px-4 py-4 align-top text-sm font-semibold text-gray-700">
                      {index + 1}
                    </td>
                    {CSV_COLUMNS.map((column) => (
                      <td key={column.key} className="border border-gray-200 bg-white px-3 py-3 align-top">
                        <div
                          className={`flex items-center gap-2 ${
                            column.key === "description" ? "min-w-[420px]" : "min-w-[150px]"
                          }`}
                        >
                          {column.key === "category" ? (
                            <select
                              value={row[column.key]}
                              onChange={(event) =>
                                updateRow(row.id, column.key, event.target.value)
                              }
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-all duration-200 focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select a category</option>
                              {PRODUCT_CATEGORY_OPTIONS.map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          ) : column.key === "description" ? (
                            <textarea
                              ref={(element) => autoResizeTextarea(element)}
                              value={row[column.key]}
                              onChange={(event) => {
                                updateRow(row.id, column.key, event.target.value);
                                autoResizeTextarea(event.target);
                              }}
                              placeholder={column.placeholder}
                              rows={1}
                              className="min-h-[42px] w-full min-w-[320px] resize-none overflow-y-hidden rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-all duration-200 focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <input
                              type="text"
                              value={row[column.key]}
                              onChange={(event) =>
                                updateRow(row.id, column.key, event.target.value)
                              }
                              placeholder={column.placeholder}
                              readOnly={column.key === "image"}
                              className={`w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-all duration-200 focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                column.key === "image"
                                  ? "cursor-default bg-gray-100 text-gray-500"
                                  : "bg-gray-50"
                              }`}
                            />
                          )}
                          {column.key === "image" && (
                            <>
                              <input
                                ref={(element) => {
                                  fileInputRefs.current[row.id] = element;
                                }}
                                type="file"
                                accept="image/*"
                                onChange={(event) =>
                                  handleImageUpload(row.id, event.target.files?.[0])
                                }
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => triggerImagePicker(row.id)}
                                disabled={row.imageUploading}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                                title="Upload image"
                              >
                                {row.imageUploading ? (
                                  <LoaderCircle className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}
                                <span>{row.image ? "Replace" : "Upload"}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => copyImageUrl(row.id, row.image)}
                                disabled={!row.image.trim() || row.imageUploading}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-all duration-200 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                                title="Copy image URL"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                        {column.key === "image" && row.image && (
                          <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                            <div className="flex items-start gap-3">
                              <img
                                src={row.image}
                                alt={row.title || "Uploaded product"}
                                className="h-14 w-14 rounded-lg object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-700">
                                  {row.imageName || "Uploaded image"}
                                </p>
                                <p className="truncate text-xs text-gray-500">{row.image}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => clearUploadedImage(row.id)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 hover:scale-105"
                                style={{
                                  border: "1px solid #e7b396",
                                  backgroundColor: "#fff4ee",
                                  color: "#b85f2f",
                                }}
                                title="Remove uploaded image"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="border border-gray-200 bg-white px-3 py-3 align-top">
                      <div className="flex min-w-[120px] gap-2">
                        <button
                          type="button"
                          onClick={() => insertRowAfter(row.id)}
                          className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add Row</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                          style={{
                            border: "1px solid #e7b396",
                            backgroundColor: "#fff4ee",
                            color: "#b85f2f",
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CsvBuilder;
