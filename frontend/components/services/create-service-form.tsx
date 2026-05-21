"use client";

import { useRouter } from "next/navigation";
import { AutoComplete } from "primereact/autocomplete";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { FloatLabel } from "primereact/floatlabel";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createService, uploadServiceImage } from "@/lib/api";
import { readStoredUser } from "@/lib/auth-storage";
import {
  LISTABLE_SERVICE_CATEGORIES,
  type ServiceCategoryId,
} from "@/lib/service-categories";
import {
  filterServiceLocations,
  findServiceLocation,
  type ServiceLocationOption,
} from "@/lib/service-locations";
import { DEFAULT_SERVICE_IMAGE_PATH } from "@/lib/service-display";

const MIN_NAME_LENGTH = 5;
const MIN_DESCRIPTION_LENGTH = 50;
const SERVICE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const SERVICE_IMAGE_SIZE_ERROR = "Image must be between 1 byte and 5 MB.";

function isServiceImageSizeValid(file: File): boolean {
  return file.size > 0 && file.size <= SERVICE_IMAGE_MAX_BYTES;
}

type CategoryOption = { label: string; value: ServiceCategoryId };

const CATEGORY_OPTIONS: CategoryOption[] = LISTABLE_SERVICE_CATEGORIES.map(
  (category) => ({
    label: category.label,
    value: category.id,
  }),
);

type FieldErrors = {
  name?: string;
  description?: string;
  location?: string;
  price?: string;
  category?: string;
};

function buildDescriptionWithCategory(
  description: string,
  categoryId: ServiceCategoryId,
): string {
  const body = description.trim();
  return `${body}\n\nCategory: ${categoryId}`;
}

function RequiredFieldMark(): JSX.Element {
  return (
    <span className="create-service-form__required" aria-hidden="true">
      *
    </span>
  );
}

export function CreateServiceForm(): JSX.Element {
  const router = useRouter();
  const toastRef = useRef<Toast>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [toastAppendTo, setToastAppendTo] = useState<HTMLElement | "self">("self");

  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<ServiceLocationOption | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<
    ServiceLocationOption[]
  >([]);
  const [categoryId, setCategoryId] = useState<ServiceCategoryId | null>(null);
  const [priceEur, setPriceEur] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setToastAppendTo(document.body);
    const user = readStoredUser();
    if (user) {
      setUserId(user.id);
      return;
    }
    toastRef.current?.show({
      severity: "warn",
      summary: "Sign in required",
      detail: "Log in to list a service under your account.",
      life: 5000,
    });
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);
    return (): void => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  const resolvedLocation = useMemo(
    () => selectedLocation ?? findServiceLocation(locationInput),
    [selectedLocation, locationInput],
  );

  const validation = useMemo(() => {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const errors: FieldErrors = {};

    if (trimmedName.length < MIN_NAME_LENGTH) {
      errors.name = `Name must be at least ${MIN_NAME_LENGTH} characters.`;
    }
    if (trimmedDescription.length < MIN_DESCRIPTION_LENGTH) {
      errors.description = `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters.`;
    }
    if (!resolvedLocation) {
      errors.location = "Choose a location from the suggestions.";
    }
    if (priceEur === null || priceEur < 0) {
      errors.price = "Price is required.";
    }
    if (!categoryId) {
      errors.category = "Category is required.";
    }

    return {
      errors,
      isValid: Object.keys(errors).length === 0,
    };
  }, [name, description, resolvedLocation, priceEur, categoryId]);

  const canSubmit = userId.trim().length > 0 && validation.isValid;

  const validateFields = (): FieldErrors => {
    const errors = { ...validation.errors };
    setFieldErrors(errors);
    return errors;
  };

  const handleLocationQuery = (query: string): void => {
    setLocationSuggestions(filterServiceLocations(query));
  };

  const resetFormFields = (): void => {
    setName("");
    setDescription("");
    setLocationInput("");
    setSelectedLocation(null);
    setLocationSuggestions([]);
    setCategoryId(null);
    setPriceEur(null);
    setImageFile(null);
    setFieldErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setError(null);

    const errors = validateFields();
    if (Object.keys(errors).length > 0) {
      return;
    }

    if (priceEur === null || !categoryId || !resolvedLocation) {
      return;
    }

    if (!userId.trim()) {
      return;
    }

    startTransition(async () => {
      try {
        let imageUrl: string | undefined;
        if (imageFile) {
          const uploaded = await uploadServiceImage(imageFile);
          imageUrl = uploaded.image_url;
        }
        const priceCents = Math.round(priceEur * 100);
        const created = await createService({
          userId: userId.trim(),
          name: name.trim(),
          description: buildDescriptionWithCategory(description, categoryId),
          location: resolvedLocation.label,
          priceCents,
          latitude: resolvedLocation.latitude,
          longitude: resolvedLocation.longitude,
          imageUrl,
        });
        toastRef.current?.show({
          severity: "success",
          summary: "Service published",
          detail: `"${created.name}" was published successfully.`,
          life: 4000,
        });
        resetFormFields();
        router.refresh();
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Could not list service.";
        if (message === SERVICE_IMAGE_SIZE_ERROR) {
          toastRef.current?.show({
            severity: "error",
            summary: "Invalid image",
            detail: SERVICE_IMAGE_SIZE_ERROR,
            life: 5000,
          });
          return;
        }
        setError(message);
      }
    });
  };

  const showNameError = fieldErrors.name !== undefined;
  const showDescriptionError = fieldErrors.description !== undefined;
  const showLocationError = fieldErrors.location !== undefined;
  const showPriceError = fieldErrors.price !== undefined;
  const showCategoryError = fieldErrors.category !== undefined;

  return (
    <form className="create-service-form flex flex-column gap-4" onSubmit={handleSubmit}>
      <Toast ref={toastRef} position="top-center" appendTo={toastAppendTo} />

      {error ? <Message severity="error" text={error} className="w-full" /> : null}
      <div className="create-service-form__image-field flex flex-column gap-2">
        <span id="service-image-label" className="font-semibold text-color">
          Service photo{" "}
          <span className="text-color-secondary font-normal">(optional)</span>
        </span>
        <p className="text-color-secondary text-sm m-0">
          If you skip a photo, the default service image will be shown in the
          catalog.
        </p>
        <input
          ref={fileInputRef}
          id="service-image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="create-service-form__file-input"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            if (!file) {
              setImageFile(null);
              return;
            }
            if (!isServiceImageSizeValid(file)) {
              e.target.value = "";
              toastRef.current?.show({
                severity: "error",
                summary: "Invalid image",
                detail: SERVICE_IMAGE_SIZE_ERROR,
                life: 5000,
              });
              return;
            }
            setImageFile(file);
          }}
          tabIndex={-1}
          aria-labelledby="service-image-label"
        />
        <Button
          type="button"
          label={imageFile ? "Change photo" : "Choose photo"}
          icon="pi pi-image"
          outlined
          className="align-self-start"
          aria-controls="service-image"
          onClick={() => fileInputRef.current?.click()}
        />
        {imageFile ? (
          <p className="text-color-secondary text-sm m-0">{imageFile.name}</p>
        ) : null}
        {imagePreviewUrl ? (
          <img
            src={imagePreviewUrl}
            alt=""
            className="create-service-form__preview"
          />
        ) : (
          <img
            src={DEFAULT_SERVICE_IMAGE_PATH}
            alt=""
            className="create-service-form__preview create-service-form__preview--default"
          />
        )}
      </div>
      

      <div className="field flex flex-column gap-1">
        <FloatLabel>
          <InputText
            id="service-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) {
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            className={`w-full${showNameError ? " p-invalid" : ""}`}
            aria-invalid={showNameError}
            aria-required
          />
          <label htmlFor="service-name">
            Name <RequiredFieldMark />
          </label>
        </FloatLabel>
        {showNameError ? (
          <small className="p-error m-0">{fieldErrors.name}</small>
        ) : null}
      </div>

      <div className="field flex flex-column gap-1">
        <FloatLabel>
          <InputTextarea
            id="service-description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (fieldErrors.description) {
                setFieldErrors((prev) => ({ ...prev, description: undefined }));
              }
            }}
            className={`w-full${showDescriptionError ? " p-invalid" : ""}`}
            rows={4}
            aria-invalid={showDescriptionError}
            aria-required
          />
          <label htmlFor="service-description">
            Description <RequiredFieldMark />
          </label>
        </FloatLabel>
        {showDescriptionError ? (
          <small className="p-error m-0">{fieldErrors.description}</small>
        ) : null}
      </div>

      <div className="field flex flex-column gap-1">
        <FloatLabel>
          <AutoComplete
            inputId="service-location"
            value={locationInput}
            suggestions={locationSuggestions}
            completeMethod={(e) => handleLocationQuery(e.query)}
            field="label"
            onChange={(e) => {
              const value = typeof e.value === "string" ? e.value : "";
              setLocationInput(value);
              setSelectedLocation(null);
              if (fieldErrors.location) {
                setFieldErrors((prev) => ({ ...prev, location: undefined }));
              }
            }}
            onSelect={(e) => {
              const option = e.value as ServiceLocationOption;
              setLocationInput(option.label);
              setSelectedLocation(option);
              if (fieldErrors.location) {
                setFieldErrors((prev) => ({ ...prev, location: undefined }));
              }
            }}
            onFocus={() => handleLocationQuery(locationInput)}
            dropdown
            className={`w-full${showLocationError ? " p-invalid" : ""}`}
            inputClassName="w-full"
            aria-invalid={showLocationError}
            aria-required
          />
          <label htmlFor="service-location">
            Location <RequiredFieldMark />
          </label>
        </FloatLabel>
        {showLocationError ? (
          <small className="p-error m-0">{fieldErrors.location}</small>
        ) : null}
      </div>

      <div className="field flex flex-column gap-1">
        <FloatLabel>
          <Dropdown
            inputId="service-category"
            value={categoryId}
            onChange={(e) => {
              setCategoryId((e.value as ServiceCategoryId | null) ?? null);
              if (fieldErrors.category) {
                setFieldErrors((prev) => ({ ...prev, category: undefined }));
              }
            }}
            options={CATEGORY_OPTIONS}
            optionLabel="label"
            optionValue="value"
            placeholder="Select a category"
            className={`w-full${showCategoryError ? " p-invalid" : ""}`}
            aria-invalid={showCategoryError}
            aria-required
          />
          <label htmlFor="service-category">
            Category <RequiredFieldMark />
          </label>
        </FloatLabel>
        {showCategoryError ? (
          <small className="p-error m-0">{fieldErrors.category}</small>
        ) : null}
      </div>

      <div className="field flex flex-column gap-1">
        <FloatLabel>
          <InputNumber
            inputId="service-price"
            value={priceEur}
            onValueChange={(e) => {
              setPriceEur(e.value ?? null);
              if (fieldErrors.price) {
                setFieldErrors((prev) => ({ ...prev, price: undefined }));
              }
            }}
            mode="currency"
            currency="EUR"
            locale="en-US"
            min={0}
            minFractionDigits={0}
            maxFractionDigits={2}
            className={`w-full${showPriceError ? " p-invalid" : ""}`}
            inputClassName="w-full"
            aria-invalid={showPriceError}
            aria-required
          />
          <label htmlFor="service-price">
            Price (EUR) <RequiredFieldMark />
          </label>
        </FloatLabel>
        {showPriceError ? (
          <small className="p-error m-0">{fieldErrors.price}</small>
        ) : null}
      </div>

      <Button
        type="submit"
        label={pending ? "Publishing…" : "Publish service"}
        disabled={pending || !canSubmit}
        className="align-self-end"
      />
    </form>
  );
}
