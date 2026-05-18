"use client";

import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Message } from "primereact/message";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createService, uploadServiceImage } from "@/lib/api";
import { readStoredUser } from "@/lib/auth-storage";

const SOFIA_LAT = 42.6977;
const SOFIA_LNG = 23.3219;

export function CreateServiceForm(): JSX.Element {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [priceEur, setPriceEur] = useState<number | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number>(SOFIA_LAT);
  const [longitude, setLongitude] = useState<number>(SOFIA_LNG);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const user = readStoredUser();
    if (user) {
      setUserId(user.id);
    }
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

  const canSubmit = useMemo(
    () =>
      userId.trim().length > 0 &&
      name.trim().length > 0 &&
      description.trim().length > 0 &&
      location.trim().length > 0 &&
      priceEur !== null &&
      priceEur >= 0 &&
      imageFile !== null,
    [userId, name, description, location, priceEur, imageFile],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!imageFile || priceEur === null) {
      setError("Please add a photo and price for your service.");
      return;
    }

    startTransition(async () => {
      try {
        const { image_url } = await uploadServiceImage(imageFile);
        const priceCents = Math.round(priceEur * 100);
        const created = await createService({
          userId: userId.trim(),
          name: name.trim(),
          description: description.trim(),
          location: location.trim(),
          priceCents,
          latitude,
          longitude,
          imageUrl: image_url,
          rating: rating ?? undefined,
        });
        setSuccess(`"${created.name}" was listed successfully.`);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not list service.");
      }
    });
  };

  return (
    <form className="create-service-form flex flex-column gap-4" onSubmit={handleSubmit}>
      {!userId ? (
        <Message
          severity="warn"
          text="Log in to list a service under your account."
          className="w-full"
        />
      ) : null}

      {error ? <Message severity="error" text={error} className="w-full" /> : null}
      {success ? <Message severity="success" text={success} className="w-full" /> : null}

      <div className="create-service-form__image-field flex flex-column gap-2">
        <label htmlFor="service-image" className="font-semibold text-color">
          Service photo <span className="text-red-500">*</span>
        </label>
        <input
          id="service-image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="create-service-form__file-input"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setImageFile(file);
          }}
        />
        {imagePreviewUrl ? (
          <img
            src={imagePreviewUrl}
            alt=""
            className="create-service-form__preview"
          />
        ) : null}
      </div>

      <span className="p-float-label">
        <InputText
          id="service-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full"
          required
        />
        <label htmlFor="service-name">Name</label>
      </span>

      <span className="p-float-label">
        <InputTextarea
          id="service-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full"
          rows={4}
          required
        />
        <label htmlFor="service-description">Description</label>
      </span>

      <span className="p-float-label">
        <InputText
          id="service-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full"
          required
        />
        <label htmlFor="service-location">Location</label>
      </span>

      <div className="grid">
        <div className="col-12 md:col-6">
          <span className="p-float-label w-full">
            <InputNumber
              id="service-price"
              value={priceEur}
              onValueChange={(e) => setPriceEur(e.value ?? null)}
              mode="currency"
              currency="EUR"
              locale="en-US"
              minFractionDigits={0}
              maxFractionDigits={2}
              className="w-full"
            />
            <label htmlFor="service-price">Price (EUR)</label>
          </span>
        </div>
        <div className="col-12 md:col-6">
          <span className="p-float-label w-full">
            <InputNumber
              id="service-rating"
              value={rating}
              onValueChange={(e) => setRating(e.value ?? null)}
              min={0}
              max={5}
              minFractionDigits={0}
              maxFractionDigits={2}
              className="w-full"
            />
            <label htmlFor="service-rating">Rating (optional)</label>
          </span>
        </div>
      </div>

      <div className="grid">
        <div className="col-12 md:col-6">
          <span className="p-float-label w-full">
            <InputNumber
              id="service-lat"
              value={latitude}
              onValueChange={(e) => setLatitude(e.value ?? SOFIA_LAT)}
              minFractionDigits={4}
              maxFractionDigits={6}
              className="w-full"
            />
            <label htmlFor="service-lat">Latitude</label>
          </span>
        </div>
        <div className="col-12 md:col-6">
          <span className="p-float-label w-full">
            <InputNumber
              id="service-lng"
              value={longitude}
              onValueChange={(e) => setLongitude(e.value ?? SOFIA_LNG)}
              minFractionDigits={4}
              maxFractionDigits={6}
              className="w-full"
            />
            <label htmlFor="service-lng">Longitude</label>
          </span>
        </div>
      </div>

      <Button
        type="submit"
        label={pending ? "Publishing…" : "Publish service"}
        disabled={pending || !canSubmit}
        className="align-self-start"
      />
    </form>
  );
}
