"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  createCreatorService,
  createServiceSlot,
  getCreator,
  listServices,
  updateCreatorService,
  upsertCreatorProfile
} from "@streets/api-client";
import type { AuthSession, Service } from "@streets/types";

const sessionStorageKey = "streets.session";

const emptyProfile = {
  display_name: "",
  bio: "",
  country: "",
  service_region: ""
};

const emptyService = {
  title: "",
  description: "",
  category: "",
  duration_minutes: 30,
  price: 10000,
  currency: "USD",
  fulfillment_type: "video"
};

export function CreatorDashboard() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState(emptyProfile);
  const [services, setServices] = useState<Service[]>([]);
  const [slotServiceId, setSlotServiceId] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = window.localStorage.getItem(sessionStorageKey);
    const parsed = raw ? (JSON.parse(raw) as AuthSession) : null;
    setSession(parsed);
  }, []);

  useEffect(() => {
    if (!session || (session.user.role !== "creator" && session.user.role !== "admin")) {
      return;
    }

    async function loadDashboard() {
      setError("");
      try {
        const [creatorProfile, creatorServices] = await Promise.all([
          getCreator(session.user.id).catch(() => null),
          listServices({ creator_id: session.user.id })
        ]);

        if (creatorProfile) {
          setProfile({
            display_name: creatorProfile.display_name,
            bio: creatorProfile.bio,
            country: creatorProfile.country,
            service_region: creatorProfile.service_region
          });
        }

        setServices(creatorServices);
        if (creatorServices.length > 0 && !slotServiceId) {
          setSlotServiceId(creatorServices[0].id);
        }
      } catch {
        setError("Could not load creator dashboard data.");
      }
    }

    loadDashboard();
  }, [session, slotServiceId]);

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setError("");
    setMessage("");
    try {
      const saved = await upsertCreatorProfile(session.user.id, profile, session.access_token);
      setProfile({
        display_name: saved.display_name,
        bio: saved.bio,
        country: saved.country,
        service_region: saved.service_region
      });
      setMessage("Profile saved.");
    } catch {
      setError("Profile update failed.");
    }
  }

  async function handleServiceSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setError("");
    setMessage("");
    try {
      const created = await createCreatorService(
        session.user.id,
        {
          ...serviceForm,
          duration_minutes: Number(serviceForm.duration_minutes),
          price: Number(serviceForm.price)
        },
        session.access_token
      );
      setServices((current) => [created, ...current]);
      setSlotServiceId(created.id);
      setServiceForm(emptyService);
      setMessage("Service created.");
    } catch {
      setError("Service creation failed.");
    }
  }

  async function handleToggleService(service: Service) {
    if (!session) {
      return;
    }

    setError("");
    setMessage("");
    try {
      const updated = await updateCreatorService(
        session.user.id,
        service.id,
        { is_active: !service.is_active },
        session.access_token
      );
      setServices((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry))
      );
      setMessage(`Service ${updated.is_active ? "activated" : "deactivated"}.`);
    } catch {
      setError("Service status update failed.");
    }
  }

  async function handleSlotSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !slotServiceId) {
      return;
    }

    setError("");
    setMessage("");
    try {
      await createServiceSlot(
        session.user.id,
        slotServiceId,
        {
          starts_at: new Date(slotStart).toISOString(),
          ends_at: new Date(slotEnd).toISOString()
        },
        session.access_token
      );
      setSlotStart("");
      setSlotEnd("");
      setMessage("Availability slot published.");
    } catch {
      setError("Slot publishing failed.");
    }
  }

  if (!session) {
    return (
      <section className="panel">
        <p className="eyebrow">Creator</p>
        <h1>Creator dashboard</h1>
        <p>
          Sign in with a creator account first. You can create one from the auth page.
        </p>
        <Link href="/auth" className="buttonLink">
          Go to auth
        </Link>
      </section>
    );
  }

  if (session.user.role !== "creator" && session.user.role !== "admin") {
    return (
      <section className="panel">
        <p className="eyebrow">Creator</p>
        <h1>Creator dashboard</h1>
        <p>
          The current session is a buyer account. Sign out and create a creator session to
          manage listings.
        </p>
        <Link href="/auth" className="buttonLink">
          Switch account
        </Link>
      </section>
    );
  }

  return (
    <section className="panel stack">
      <div>
        <p className="eyebrow">Creator</p>
        <h1>Manage profile and listings</h1>
        <p>
          Signed in as {session.user.email}. Use this dashboard to publish a profile,
          create services, and add availability slots.
        </p>
      </div>

      {message ? <p>{message}</p> : null}
      {error ? <p className="errorText">{error}</p> : null}

      <form className="card stack" onSubmit={handleProfileSubmit}>
        <h3>Profile</h3>
        <input
          className="input"
          placeholder="Display name"
          value={profile.display_name}
          onChange={(event) => setProfile({ ...profile, display_name: event.target.value })}
        />
        <textarea
          className="input textarea"
          placeholder="Bio"
          value={profile.bio}
          onChange={(event) => setProfile({ ...profile, bio: event.target.value })}
        />
        <div className="twoCol">
          <input
            className="input"
            placeholder="Country"
            value={profile.country}
            onChange={(event) => setProfile({ ...profile, country: event.target.value })}
          />
          <input
            className="input"
            placeholder="Service region"
            value={profile.service_region}
            onChange={(event) => setProfile({ ...profile, service_region: event.target.value })}
          />
        </div>
        <button className="button" type="submit">
          Save profile
        </button>
      </form>

      <form className="card stack" onSubmit={handleServiceSubmit}>
        <h3>Create service</h3>
        <input
          className="input"
          placeholder="Title"
          value={serviceForm.title}
          onChange={(event) => setServiceForm({ ...serviceForm, title: event.target.value })}
        />
        <textarea
          className="input textarea"
          placeholder="Description"
          value={serviceForm.description}
          onChange={(event) => setServiceForm({ ...serviceForm, description: event.target.value })}
        />
        <div className="twoCol">
          <input
            className="input"
            placeholder="Category"
            value={serviceForm.category}
            onChange={(event) => setServiceForm({ ...serviceForm, category: event.target.value })}
          />
          <select
            className="input"
            value={serviceForm.fulfillment_type}
            onChange={(event) =>
              setServiceForm({ ...serviceForm, fulfillment_type: event.target.value })
            }
          >
            <option value="video">Video</option>
            <option value="audio_call">Audio call</option>
            <option value="chat">Chat</option>
            <option value="custom_request">Custom request</option>
            <option value="in_person">In person</option>
          </select>
        </div>
        <div className="twoCol">
          <input
            className="input"
            type="number"
            min="1"
            value={serviceForm.duration_minutes}
            onChange={(event) =>
              setServiceForm({ ...serviceForm, duration_minutes: Number(event.target.value) })
            }
          />
          <input
            className="input"
            type="number"
            min="100"
            step="100"
            value={serviceForm.price}
            onChange={(event) =>
              setServiceForm({ ...serviceForm, price: Number(event.target.value) })
            }
          />
        </div>
        <button className="button" type="submit">
          Create service
        </button>
      </form>

      <form className="card stack" onSubmit={handleSlotSubmit}>
        <h3>Publish slot</h3>
        <select
          className="input"
          value={slotServiceId}
          onChange={(event) => setSlotServiceId(event.target.value)}
        >
          <option value="">Select service</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.title}
            </option>
          ))}
        </select>
        <div className="twoCol">
          <input
            className="input"
            type="datetime-local"
            value={slotStart}
            onChange={(event) => setSlotStart(event.target.value)}
          />
          <input
            className="input"
            type="datetime-local"
            value={slotEnd}
            onChange={(event) => setSlotEnd(event.target.value)}
          />
        </div>
        <button className="button" type="submit" disabled={!slotServiceId || !slotStart || !slotEnd}>
          Publish slot
        </button>
      </form>

      <div className="grid">
        {services.map((service) => (
          <article key={service.id} className="card">
            <p className="badge">{service.fulfillment_type.replace("_", " ")}</p>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            <p>
              {service.category} - {service.duration_minutes} min
            </p>
            <p>{service.price} cents</p>
            <p>{service.is_active ? "Active" : "Inactive"}</p>
            <button className="button secondaryButton" type="button" onClick={() => handleToggleService(service)}>
              {service.is_active ? "Deactivate" : "Activate"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
