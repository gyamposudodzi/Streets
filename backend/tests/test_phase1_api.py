import os

os.environ.setdefault("STREETS_SQLITE_PATH", "backend/data/streets_test.db")

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
    assert len(services) >= 2
    assert all(service["moderation_status"] == "approved" for service in services)


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
        json={"service_id": service_id},
        headers={"Authorization": f"Bearer {token}"},
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


def test_admin_dashboard_requires_admin_and_returns_data() -> None:
    unauthorized = client.get("/api/v1/admin/dashboard")
    assert unauthorized.status_code == 401

    non_admin_register = client.post(
        "/api/v1/auth/register",
        json={
            "email": "dashboard-user@streets.local",
            "role": "user",
            "is_age_verified": True,
        },
    )
    assert non_admin_register.status_code == 200
    non_admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "dashboard-user@streets.local"},
    )
    forbidden = client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {non_admin_login.json()['access_token']}"},
    )
    assert forbidden.status_code == 403

    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@streets.local"},
    )
    assert admin_login.status_code == 200
    admin_response = client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {admin_login.json()['access_token']}"},
    )
    assert admin_response.status_code == 200
    dashboard = admin_response.json()
    assert dashboard["overview"]["total_users"] >= 3
    assert len(dashboard["services"]) >= 3


def test_simulated_payment_moves_booking_to_held_funds() -> None:
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "payment-buyer@streets.local",
            "role": "user",
            "is_age_verified": True,
        },
    )
    assert register_response.status_code == 200
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "payment-buyer@streets.local"},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    service_id = repository.list_services()[0].id
    booking_response = client.post(
        "/api/v1/bookings",
        json={"service_id": service_id},
        headers=headers,
    )
    assert booking_response.status_code == 201
    booking = booking_response.json()
    assert booking["status"] == "pending_payment"

    intent_response = client.post(
        "/api/v1/payments/create-intent",
        json={"booking_id": booking["id"]},
        headers=headers,
    )
    assert intent_response.status_code == 200
    payment = intent_response.json()["payment"]
    assert payment["status"] == "requires_action"

    success_response = client.post(
        f"/api/v1/payments/{payment['id']}/simulate-success",
        headers=headers,
    )
    assert success_response.status_code == 200
    assert success_response.json()["status"] == "succeeded"

    updated_booking_response = client.get(f"/api/v1/bookings/{booking['id']}")
    assert updated_booking_response.status_code == 200
    assert updated_booking_response.json()["status"] == "paid_pending_acceptance"

    payment_state_response = client.get(f"/api/v1/payments/bookings/{booking['id']}")
    assert payment_state_response.status_code == 200
    payment_state = payment_state_response.json()
    assert len(payment_state["held_funds"]) == 1
    assert len(payment_state["ledger_entries"]) == 3
    assert len(payment_state["webhook_events"]) == 1
    assert payment_state["webhook_events"][0]["status"] == "processed"


def create_paid_booking_for_admin_action(email: str) -> tuple[str, dict[str, str]]:
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "role": "user",
            "is_age_verified": True,
        },
    )
    assert register_response.status_code == 200
    login_response = client.post("/api/v1/auth/login", json={"email": email})
    buyer_headers = {"Authorization": f"Bearer {login_response.json()['access_token']}"}
    service_id = repository.list_services()[0].id
    booking_response = client.post(
        "/api/v1/bookings",
        json={"service_id": service_id},
        headers=buyer_headers,
    )
    booking_id = booking_response.json()["id"]
    intent_response = client.post(
        "/api/v1/payments/create-intent",
        json={"booking_id": booking_id},
        headers=buyer_headers,
    )
    payment_id = intent_response.json()["payment"]["id"]
    success_response = client.post(
        f"/api/v1/payments/{payment_id}/simulate-success",
        headers=buyer_headers,
    )
    assert success_response.status_code == 200

    admin_login = client.post("/api/v1/auth/login", json={"email": "admin@streets.local"})
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
    return booking_id, admin_headers


def test_admin_can_release_held_funds() -> None:
    booking_id, admin_headers = create_paid_booking_for_admin_action(
        "release-buyer@streets.local"
    )

    release_response = client.post(
        f"/api/v1/admin/bookings/{booking_id}/release",
        headers=admin_headers,
    )
    assert release_response.status_code == 200
    assert release_response.json()[0]["status"] == "released"

    booking_response = client.get(f"/api/v1/bookings/{booking_id}")
    assert booking_response.json()["status"] == "released"

    payment_state_response = client.get(f"/api/v1/payments/bookings/{booking_id}")
    ledger_types = [
        entry["entry_type"]
        for entry in payment_state_response.json()["ledger_entries"]
    ]
    assert "funds_released" in ledger_types


def test_admin_can_refund_held_funds() -> None:
    booking_id, admin_headers = create_paid_booking_for_admin_action(
        "refund-buyer@streets.local"
    )

    refund_response = client.post(
        f"/api/v1/admin/bookings/{booking_id}/refund",
        headers=admin_headers,
    )
    assert refund_response.status_code == 200
    assert refund_response.json()[0]["status"] == "refunded"

    booking_response = client.get(f"/api/v1/bookings/{booking_id}")
    assert booking_response.json()["status"] == "refunded"

    payment_state_response = client.get(f"/api/v1/payments/bookings/{booking_id}")
    ledger_types = [
        entry["entry_type"]
        for entry in payment_state_response.json()["ledger_entries"]
    ]
    assert "refund_issued" in ledger_types


def test_creator_can_accept_paid_booking() -> None:
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "accept-creator@streets.local",
            "role": "creator",
            "is_age_verified": True,
        },
    )
    creator_login = client.post(
        "/api/v1/auth/login",
        json={"email": "accept-creator@streets.local"},
    )
    creator_headers = {
        "Authorization": f"Bearer {creator_login.json()['access_token']}"
    }
    creator_id = creator_login.json()["user"]["id"]
    client.put(
        f"/api/v1/creators/{creator_id}",
        json={
            "display_name": "Accept Creator",
            "bio": "Booking acceptance test.",
            "country": "US",
            "service_region": "Austin",
        },
        headers=creator_headers,
    )
    service_response = client.post(
        f"/api/v1/services/creator/{creator_id}",
        json={
            "title": "Accepted service",
            "description": "Paid booking acceptance.",
            "category": "consulting",
            "duration_minutes": 45,
            "price": 15000,
            "currency": "USD",
            "fulfillment_type": "video",
        },
        headers=creator_headers,
    )

    buyer_register = client.post(
        "/api/v1/auth/register",
        json={
            "email": "accept-buyer@streets.local",
            "role": "user",
            "is_age_verified": True,
        },
    )
    assert buyer_register.status_code == 200
    buyer_login = client.post(
        "/api/v1/auth/login",
        json={"email": "accept-buyer@streets.local"},
    )
    buyer_headers = {
        "Authorization": f"Bearer {buyer_login.json()['access_token']}"
    }
    booking_response = client.post(
        "/api/v1/bookings",
        json={"service_id": service_response.json()["id"]},
        headers=buyer_headers,
    )
    intent_response = client.post(
        "/api/v1/payments/create-intent",
        json={"booking_id": booking_response.json()["id"]},
        headers=buyer_headers,
    )
    client.post(
        f"/api/v1/payments/{intent_response.json()['payment']['id']}/simulate-success",
        headers=buyer_headers,
    )

    accept_response = client.post(
        f"/api/v1/bookings/{booking_response.json()['id']}/accept",
        headers=creator_headers,
    )
    assert accept_response.status_code == 200
    assert accept_response.json()["status"] == "accepted"


def test_creator_can_decline_paid_booking_and_refund_held_funds() -> None:
    booking_id, _ = create_paid_booking_for_admin_action(
        "decline-buyer@streets.local"
    )
    creator_login = client.post(
        "/api/v1/auth/login",
        json={"email": "creator@streets.local"},
    )
    creator_headers = {
        "Authorization": f"Bearer {creator_login.json()['access_token']}"
    }

    decline_response = client.post(
        f"/api/v1/bookings/{booking_id}/decline",
        headers=creator_headers,
    )
    assert decline_response.status_code == 200
    assert decline_response.json()["status"] == "declined"

    payment_state_response = client.get(f"/api/v1/payments/bookings/{booking_id}")
    payment_state = payment_state_response.json()
    assert payment_state["held_funds"][0]["status"] == "refunded"
    ledger_types = [entry["entry_type"] for entry in payment_state["ledger_entries"]]
    assert "refund_issued" in ledger_types

    events_response = client.get(f"/api/v1/bookings/{booking_id}/events")
    event_types = [event["event_type"] for event in events_response.json()]
    assert "booking.declined" in event_types


def test_booking_delivery_completion_and_dispute_resolution_flow() -> None:
    booking_id, admin_headers = create_paid_booking_for_admin_action(
        "lifecycle-buyer@streets.local"
    )
    creator_login = client.post(
        "/api/v1/auth/login",
        json={"email": "creator@streets.local"},
    )
    creator_headers = {
        "Authorization": f"Bearer {creator_login.json()['access_token']}"
    }

    accept_response = client.post(
        f"/api/v1/bookings/{booking_id}/accept",
        headers=creator_headers,
    )
    assert accept_response.status_code == 200
    assert accept_response.json()["status"] == "accepted"

    start_response = client.post(
        f"/api/v1/bookings/{booking_id}/start",
        headers=creator_headers,
    )
    assert start_response.status_code == 200
    assert start_response.json()["status"] == "in_progress"

    deliver_response = client.post(
        f"/api/v1/bookings/{booking_id}/deliver",
        headers=creator_headers,
    )
    assert deliver_response.status_code == 200
    assert deliver_response.json()["status"] == "awaiting_release"
    assert deliver_response.json()["release_at"] is not None

    buyer_login = client.post(
        "/api/v1/auth/login",
        json={"email": "lifecycle-buyer@streets.local"},
    )
    buyer_headers = {
        "Authorization": f"Bearer {buyer_login.json()['access_token']}"
    }
    complete_response = client.post(
        f"/api/v1/bookings/{booking_id}/complete",
        headers=buyer_headers,
    )
    assert complete_response.status_code == 200
    assert complete_response.json()["status"] == "delivered"

    release_response = client.post(
        f"/api/v1/admin/bookings/{booking_id}/release",
        headers=admin_headers,
    )
    assert release_response.status_code == 200
    assert release_response.json()[0]["status"] == "released"

    events_response = client.get(f"/api/v1/bookings/{booking_id}/events")
    event_types = [event["event_type"] for event in events_response.json()]
    assert "booking.in_progress" in event_types
    assert "service.delivered" in event_types
    assert "service.completed" in event_types


def test_booking_dispute_blocks_release_until_admin_resolution() -> None:
    booking_id, admin_headers = create_paid_booking_for_admin_action(
        "dispute-buyer@streets.local"
    )
    creator_login = client.post(
        "/api/v1/auth/login",
        json={"email": "creator@streets.local"},
    )
    creator_headers = {
        "Authorization": f"Bearer {creator_login.json()['access_token']}"
    }
    client.post(f"/api/v1/bookings/{booking_id}/accept", headers=creator_headers)
    client.post(f"/api/v1/bookings/{booking_id}/deliver", headers=creator_headers)

    buyer_login = client.post(
        "/api/v1/auth/login",
        json={"email": "dispute-buyer@streets.local"},
    )
    buyer_headers = {
        "Authorization": f"Bearer {buyer_login.json()['access_token']}"
    }
    dispute_response = client.post(
        f"/api/v1/bookings/{booking_id}/dispute",
        json={
            "reason": "Delivery issue",
            "details": "Buyer requested admin review before release.",
        },
        headers=buyer_headers,
    )
    assert dispute_response.status_code == 200
    dispute = dispute_response.json()
    assert dispute["status"] == "open"

    booking_response = client.get(f"/api/v1/bookings/{booking_id}")
    assert booking_response.json()["status"] == "disputed"

    dashboard_response = client.get("/api/v1/admin/dashboard", headers=admin_headers)
    assert dashboard_response.status_code == 200
    assert dashboard_response.json()["overview"]["open_disputes"] == 1

    resolve_response = client.post(
        f"/api/v1/admin/disputes/{dispute['id']}/resolve",
        json={"resolution": "refund"},
        headers=admin_headers,
    )
    assert resolve_response.status_code == 200
    assert resolve_response.json()["status"] == "resolved"
    assert resolve_response.json()["resolution"] == "refund"

    payment_state_response = client.get(f"/api/v1/payments/bookings/{booking_id}")
    ledger_types = [
        entry["entry_type"]
        for entry in payment_state_response.json()["ledger_entries"]
    ]
    assert "refund_issued" in ledger_types


def test_participant_can_cancel_booking_before_terminal_state() -> None:
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "cancel-buyer@streets.local",
            "role": "user",
            "is_age_verified": True,
        },
    )
    assert register_response.status_code == 200
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "cancel-buyer@streets.local"},
    )
    headers = {"Authorization": f"Bearer {login_response.json()['access_token']}"}
    service_id = repository.list_services()[0].id
    booking_response = client.post(
        "/api/v1/bookings",
        json={"service_id": service_id},
        headers=headers,
    )

    cancel_response = client.post(
        f"/api/v1/bookings/{booking_response.json()['id']}/cancel",
        headers=headers,
    )
    assert cancel_response.status_code == 200
    assert cancel_response.json()["status"] == "cancelled"


def test_booking_messages_are_limited_to_participants_and_admins() -> None:
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "chat-buyer@streets.local",
            "role": "user",
            "is_age_verified": True,
        },
    )
    buyer_login = client.post(
        "/api/v1/auth/login",
        json={"email": "chat-buyer@streets.local"},
    )
    buyer_headers = {"Authorization": f"Bearer {buyer_login.json()['access_token']}"}
    service = repository.list_services()[0]
    booking_response = client.post(
        "/api/v1/bookings",
        json={"service_id": service.id},
        headers=buyer_headers,
    )
    booking_id = booking_response.json()["id"]

    buyer_message = client.post(
        f"/api/v1/messages/bookings/{booking_id}",
        json={"body": "Hello creator"},
        headers=buyer_headers,
    )
    assert buyer_message.status_code == 201

    client.post(
        "/api/v1/auth/register",
        json={
            "email": "chat-outsider@streets.local",
            "role": "user",
            "is_age_verified": True,
        },
    )
    outsider_login = client.post(
        "/api/v1/auth/login",
        json={"email": "chat-outsider@streets.local"},
    )
    outsider_headers = {
        "Authorization": f"Bearer {outsider_login.json()['access_token']}"
    }
    outsider_read = client.get(
        f"/api/v1/messages/bookings/{booking_id}",
        headers=outsider_headers,
    )
    assert outsider_read.status_code == 403

    creator_login = client.post(
        "/api/v1/auth/login",
        json={"email": "creator@streets.local"},
    )
    creator_headers = {
        "Authorization": f"Bearer {creator_login.json()['access_token']}"
    }
    creator_read = client.get(
        f"/api/v1/messages/bookings/{booking_id}",
        headers=creator_headers,
    )
    assert creator_read.status_code == 200
    assert creator_read.json()[0]["body"] == "Hello creator"

    admin_login = client.post("/api/v1/auth/login", json={"email": "admin@streets.local"})
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
    admin_read = client.get(
        f"/api/v1/messages/bookings/{booking_id}",
        headers=admin_headers,
    )
    assert admin_read.status_code == 200


def test_reports_can_be_created_and_resolved_by_admin() -> None:
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "reporter@streets.local",
            "role": "user",
            "is_age_verified": True,
        },
    )
    reporter_login = client.post(
        "/api/v1/auth/login",
        json={"email": "reporter@streets.local"},
    )
    reporter_headers = {
        "Authorization": f"Bearer {reporter_login.json()['access_token']}"
    }
    service_id = repository.list_services()[0].id

    report_response = client.post(
        "/api/v1/reports",
        json={
            "target_type": "service",
            "target_id": service_id,
            "reason": "off platform payment request",
            "details": "The listing mentioned cash and unsafe coordination.",
        },
        headers=reporter_headers,
    )
    assert report_response.status_code == 201
    report = report_response.json()
    assert report["status"] == "open"
    assert report["risk_score"] > 0

    admin_login = client.post("/api/v1/auth/login", json={"email": "admin@streets.local"})
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
    dashboard_response = client.get("/api/v1/admin/dashboard", headers=admin_headers)
    assert dashboard_response.status_code == 200
    assert dashboard_response.json()["overview"]["open_reports"] >= 1

    resolve_response = client.post(
        f"/api/v1/admin/reports/{report['id']}/resolve",
        json={"status": "resolved"},
        headers=admin_headers,
    )
    assert resolve_response.status_code == 200
    assert resolve_response.json()["status"] == "resolved"


def test_clean_services_auto_approve_and_flagged_services_wait_for_review() -> None:
    creator_register = client.post(
        "/api/v1/auth/register",
        json={
            "email": "approval-creator@streets.local",
            "role": "creator",
            "is_age_verified": True,
        },
    )
    assert creator_register.status_code == 200
    creator_login = client.post(
        "/api/v1/auth/login",
        json={"email": "approval-creator@streets.local"},
    )
    creator_id = creator_login.json()["user"]["id"]
    creator_headers = {
        "Authorization": f"Bearer {creator_login.json()['access_token']}"
    }
    profile_response = client.put(
        f"/api/v1/creators/{creator_id}",
        json={
            "display_name": "Approval Creator",
            "bio": "Approval flow test.",
            "country": "US",
            "service_region": "Austin",
        },
        headers=creator_headers,
    )
    assert profile_response.status_code == 200
    service_response = client.post(
        f"/api/v1/services/creator/{creator_id}",
        json={
            "title": "Pending review service",
            "description": "Please coordinate on whatsapp before the booking.",
            "category": "consulting",
            "duration_minutes": 30,
            "price": 10000,
            "currency": "USD",
            "fulfillment_type": "in_person",
        },
        headers=creator_headers,
    )
    assert service_response.status_code == 201
    service = service_response.json()
    assert service["moderation_status"] == "pending_review"
    assert service["compliance_score"] > 0

    public_detail = client.get(f"/api/v1/services/{service['id']}")
    assert public_detail.status_code == 404

    creator_services = client.get(f"/api/v1/services?creator_id={creator_id}")
    assert creator_services.status_code == 200
    assert creator_services.json()[0]["id"] == service["id"]

    admin_login = client.post("/api/v1/auth/login", json={"email": "admin@streets.local"})
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
    approve_response = client.post(
        f"/api/v1/admin/services/{service['id']}/approve",
        headers=admin_headers,
    )
    assert approve_response.status_code == 200
    assert approve_response.json()["moderation_status"] == "approved"

    audit_response = client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert audit_response.status_code == 200
    assert audit_response.json()[0]["action"] == "service.approved"
    assert audit_response.json()[0]["target_id"] == service["id"]

    public_detail_after_approval = client.get(f"/api/v1/services/{service['id']}")
    assert public_detail_after_approval.status_code == 200

    clean_service_response = client.post(
        f"/api/v1/services/creator/{creator_id}",
        json={
            "title": "Clean consulting session",
            "description": "Structured planning and booking-managed coordination.",
            "category": "consulting",
            "duration_minutes": 30,
            "price": 10000,
            "currency": "USD",
            "fulfillment_type": "video",
        },
        headers=creator_headers,
    )
    assert clean_service_response.status_code == 201
    clean_service = clean_service_response.json()
    assert clean_service["moderation_status"] == "approved"
    assert clean_service["compliance_score"] == 0
