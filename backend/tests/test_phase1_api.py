from fastapi.testclient import TestClient

from app.main import app
from app.repositories.sqlite import repository


client = TestClient(app)


def setup_function() -> None:
    repository.reset()


def test_meta_endpoint_reports_phase_one() -> None:
    response = client.get("/api/v1/meta")

    assert response.status_code == 200
    body = response.json()
    assert body["phase"] == "1"
    assert body["status"] == "foundation"


def test_services_endpoint_returns_seeded_services() -> None:
    response = client.get("/api/v1/services")

    assert response.status_code == 200
    services = response.json()
    assert len(services) >= 3


def test_register_login_and_create_booking_flow() -> None:
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "phase1-user@streets.local",
            "role": "user",
            "is_age_verified": True,
        },
    )
    assert register_response.status_code == 200
    user = register_response.json()

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "phase1-user@streets.local"},
    )
    assert login_response.status_code == 200
    assert login_response.json()["user"]["id"] == user["id"]
    token = login_response.json()["access_token"]

    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "phase1-user@streets.local"

    service_id = repository.list_services()[0].id
    booking_response = client.post(
        "/api/v1/bookings",
        json={"buyer_id": user["id"], "service_id": service_id},
    )
    assert booking_response.status_code == 201
    booking = booking_response.json()
    assert booking["status"] == "pending_payment"

    event_response = client.get(f"/api/v1/bookings/{booking['id']}/events")
    assert event_response.status_code == 200
    event_types = [event["event_type"] for event in event_response.json()]
    assert event_types == ["booking.created", "booking.pending_payment"]


def test_creator_profile_service_and_slot_management() -> None:
    creator_register = client.post(
        "/api/v1/auth/register",
        json={
            "email": "phase1-creator@streets.local",
            "role": "creator",
            "is_age_verified": True,
        },
    )
    assert creator_register.status_code == 200
    creator = creator_register.json()
    creator_login = client.post(
        "/api/v1/auth/login",
        json={"email": "phase1-creator@streets.local"},
    )
    assert creator_login.status_code == 200
    creator_headers = {
        "Authorization": f"Bearer {creator_login.json()['access_token']}",
    }

    profile_response = client.put(
        f"/api/v1/creators/{creator['id']}",
        json={
            "display_name": "Taylor North",
            "bio": "Bookable creator offerings across remote and in-person formats.",
            "country": "US",
            "service_region": "Los Angeles",
        },
        headers=creator_headers,
    )
    assert profile_response.status_code == 200
    assert profile_response.json()["display_name"] == "Taylor North"

    service_response = client.post(
        f"/api/v1/services/creator/{creator['id']}",
        json={
            "title": "One-hour creator session",
            "description": "Structured creator time with a scheduled booking flow.",
            "category": "session",
            "duration_minutes": 60,
            "price": 22000,
            "currency": "USD",
            "fulfillment_type": "in_person",
        },
        headers=creator_headers,
    )
    assert service_response.status_code == 201
    service = service_response.json()

    update_response = client.patch(
        f"/api/v1/services/creator/{creator['id']}/{service['id']}",
        json={"price": 25000, "is_active": True},
        headers=creator_headers,
    )
    assert update_response.status_code == 200
    assert update_response.json()["price"] == 25000

    slot_response = client.post(
        f"/api/v1/services/creator/{creator['id']}/{service['id']}/slots",
        json={
            "starts_at": "2026-04-03T16:00:00Z",
            "ends_at": "2026-04-03T17:00:00Z",
        },
        headers=creator_headers,
    )
    assert slot_response.status_code == 201

    list_slots_response = client.get(f"/api/v1/services/{service['id']}/slots")
    assert list_slots_response.status_code == 200
    assert len(list_slots_response.json()) == 1


def test_creator_mutations_require_owner_or_admin() -> None:
    creator_register = client.post(
        "/api/v1/auth/register",
        json={
            "email": "owner-check-creator@streets.local",
            "role": "creator",
            "is_age_verified": True,
        },
    )
    creator = creator_register.json()

    unauthorized_profile = client.put(
        f"/api/v1/creators/{creator['id']}",
        json={
            "display_name": "Protected Owner",
            "bio": "Owner-only profile.",
            "country": "US",
            "service_region": "Miami",
        },
    )
    assert unauthorized_profile.status_code == 401

    other_user_register = client.post(
        "/api/v1/auth/register",
        json={
            "email": "plain-user@streets.local",
            "role": "user",
            "is_age_verified": True,
        },
    )
    assert other_user_register.status_code == 200
    other_user_login = client.post(
        "/api/v1/auth/login",
        json={"email": "plain-user@streets.local"},
    )
    other_headers = {
        "Authorization": f"Bearer {other_user_login.json()['access_token']}",
    }

    forbidden_profile = client.put(
        f"/api/v1/creators/{creator['id']}",
        json={
            "display_name": "Protected Owner",
            "bio": "Owner-only profile.",
            "country": "US",
            "service_region": "Miami",
        },
        headers=other_headers,
    )
    assert forbidden_profile.status_code == 403

    creator_login = client.post(
        "/api/v1/auth/login",
        json={"email": "owner-check-creator@streets.local"},
    )
    creator_headers = {
        "Authorization": f"Bearer {creator_login.json()['access_token']}",
    }
    allowed_profile = client.put(
        f"/api/v1/creators/{creator['id']}",
        json={
            "display_name": "Protected Owner",
            "bio": "Owner-only profile.",
            "country": "US",
            "service_region": "Miami",
        },
        headers=creator_headers,
    )
    assert allowed_profile.status_code == 200
