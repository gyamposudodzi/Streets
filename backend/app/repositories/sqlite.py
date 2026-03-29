from __future__ import annotations

from pathlib import Path
import sqlite3

from app.core.config import settings
from app.domain.enums import FulfillmentType, UserRole, VerificationStatus
from app.models.entities import (
    AvailabilitySlot,
    Booking,
    BookingEvent,
    CreatorProfile,
    Service,
    Session,
    User,
)


class SQLiteRepository:
    def __init__(self, database_path: str) -> None:
        self.database_path = database_path
        self.schema_path = Path(__file__).resolve().parents[2] / "db" / "schema.sqlite.sql"
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def _initialize(self) -> None:
        db_path = Path(self.database_path)
        db_path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as connection:
            connection.executescript(self.schema_path.read_text(encoding="utf-8"))
        self._seed_if_needed()

    def reset(self) -> None:
        db_path = Path(self.database_path)
        if db_path.exists():
            db_path.unlink()
        self._initialize()

    def _seed_if_needed(self) -> None:
        with self._connect() as connection:
            row = connection.execute("SELECT COUNT(*) AS count FROM users").fetchone()
            if row["count"] > 0:
                return

        creator_user = User(
            email="creator@streets.local",
            role=UserRole.CREATOR,
            is_age_verified=True,
            email_verified=True,
        )
        buyer_user = User(
            email="buyer@streets.local",
            role=UserRole.USER,
            is_age_verified=True,
            email_verified=True,
        )
        admin_user = User(
            email="admin@streets.local",
            role=UserRole.ADMIN,
            is_age_verified=True,
            email_verified=True,
        )

        for user in (creator_user, buyer_user, admin_user):
            self.create_user(user)

        creator_profile = CreatorProfile(
            user_id=creator_user.id,
            display_name="Jordan Vale",
            bio="Consulting, creator sessions, and custom booking experiences.",
            country="US",
            service_region="New York Metro",
            verification_status=VerificationStatus.APPROVED,
            payout_status=VerificationStatus.PENDING,
            average_rating=4.9,
        )
        self.upsert_creator_profile(creator_profile)

        service_one = Service(
            creator_id=creator_user.id,
            title="Private video consulting session",
            description="One-on-one session for guidance, planning, and direct creator access.",
            category="consulting",
            duration_minutes=45,
            price=15000,
            fulfillment_type=FulfillmentType.VIDEO,
        )
        service_two = Service(
            creator_id=creator_user.id,
            title="Custom creator request",
            description="Structured custom request delivered through booking-managed fulfillment.",
            category="custom",
            duration_minutes=72 * 60,
            price=9500,
            fulfillment_type=FulfillmentType.CUSTOM_REQUEST,
        )
        service_three = Service(
            creator_id=creator_user.id,
            title="In-person appearance booking",
            description="Neutral in-person booking flow with platform-managed scheduling and review.",
            category="appearance",
            duration_minutes=90,
            price=30000,
            fulfillment_type=FulfillmentType.IN_PERSON,
        )

        for service in (service_one, service_two, service_three):
            self.create_service(service)

        slot = AvailabilitySlot(
            creator_id=creator_user.id,
            service_id=service_one.id,
            starts_at=service_one.created_at.replace(hour=15, minute=0, second=0, microsecond=0),
            ends_at=service_one.created_at.replace(hour=15, minute=45, second=0, microsecond=0),
        )
        self.create_slot(slot)

    def _to_user(self, row: sqlite3.Row | None) -> User | None:
        if row is None:
            return None
        return User.model_validate(dict(row))

    def _to_session(self, row: sqlite3.Row | None) -> Session | None:
        if row is None:
            return None
        return Session.model_validate(dict(row))

    def _to_creator(self, row: sqlite3.Row | None) -> CreatorProfile | None:
        if row is None:
            return None
        return CreatorProfile.model_validate(dict(row))

    def _to_service(self, row: sqlite3.Row | None) -> Service | None:
        if row is None:
            return None
        return Service.model_validate(dict(row))

    def _to_slot(self, row: sqlite3.Row | None) -> AvailabilitySlot | None:
        if row is None:
            return None
        return AvailabilitySlot.model_validate(dict(row))

    def _to_booking(self, row: sqlite3.Row | None) -> Booking | None:
        if row is None:
            return None
        return Booking.model_validate(dict(row))

    def _to_booking_event(self, row: sqlite3.Row | None) -> BookingEvent | None:
        if row is None:
            return None
        return BookingEvent.model_validate(dict(row))

    def list_creators(self) -> list[CreatorProfile]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT * FROM creator_profiles ORDER BY created_at DESC"
            ).fetchall()
        return [self._to_creator(row) for row in rows]

    def get_creator(self, creator_id: str) -> CreatorProfile | None:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM creator_profiles WHERE user_id = ?",
                (creator_id,),
            ).fetchone()
        return self._to_creator(row)

    def upsert_creator_profile(self, profile: CreatorProfile) -> CreatorProfile:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO creator_profiles (
                    user_id, display_name, bio, country, service_region,
                    verification_status, payout_status, average_rating, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    display_name = excluded.display_name,
                    bio = excluded.bio,
                    country = excluded.country,
                    service_region = excluded.service_region,
                    verification_status = excluded.verification_status,
                    payout_status = excluded.payout_status,
                    average_rating = excluded.average_rating
                """,
                (
                    profile.user_id,
                    profile.display_name,
                    profile.bio,
                    profile.country,
                    profile.service_region,
                    profile.verification_status,
                    profile.payout_status,
                    profile.average_rating,
                    profile.created_at.isoformat(),
                ),
            )
        return profile

    def list_services(
        self,
        *,
        creator_id: str | None = None,
        category: str | None = None,
        fulfillment_type: FulfillmentType | None = None,
        query: str | None = None,
    ) -> list[Service]:
        clauses: list[str] = []
        values: list[str] = []
        if creator_id:
            clauses.append("creator_id = ?")
            values.append(creator_id)
        if category:
            clauses.append("LOWER(category) = LOWER(?)")
            values.append(category)
        if fulfillment_type:
            clauses.append("fulfillment_type = ?")
            values.append(str(fulfillment_type))
        if query:
            clauses.append("(LOWER(title) LIKE ? OR LOWER(description) LIKE ?)")
            search = f"%{query.lower()}%"
            values.extend([search, search])

        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        with self._connect() as connection:
            rows = connection.execute(
                f"SELECT * FROM services {where} ORDER BY created_at DESC",
                values,
            ).fetchall()
        return [self._to_service(row) for row in rows]

    def get_service(self, service_id: str) -> Service | None:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM services WHERE id = ?",
                (service_id,),
            ).fetchone()
        return self._to_service(row)

    def create_service(self, service: Service) -> Service:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO services (
                    id, creator_id, title, description, category, duration_minutes,
                    price, currency, fulfillment_type, is_active, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    service.id,
                    service.creator_id,
                    service.title,
                    service.description,
                    service.category,
                    service.duration_minutes,
                    service.price,
                    service.currency,
                    service.fulfillment_type,
                    int(service.is_active),
                    service.created_at.isoformat(),
                ),
            )
        return service

    def update_service(self, service_id: str, **changes: object) -> Service | None:
        service = self.get_service(service_id)
        if service is None:
            return None

        updates = {field: value for field, value in changes.items() if value is not None}
        if not updates:
            return service

        assignments = ", ".join(f"{field} = ?" for field in updates)
        values = list(updates.values())
        with self._connect() as connection:
            connection.execute(
                f"UPDATE services SET {assignments} WHERE id = ?",
                [*values, service_id],
            )
        return self.get_service(service_id)

    def list_slots_for_service(self, service_id: str) -> list[AvailabilitySlot]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT * FROM availability_slots WHERE service_id = ? ORDER BY starts_at ASC",
                (service_id,),
            ).fetchall()
        return [self._to_slot(row) for row in rows]

    def get_slot(self, slot_id: str) -> AvailabilitySlot | None:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM availability_slots WHERE id = ?",
                (slot_id,),
            ).fetchone()
        return self._to_slot(row)

    def create_slot(self, slot: AvailabilitySlot) -> AvailabilitySlot:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO availability_slots (
                    id, creator_id, service_id, starts_at, ends_at, is_reserved
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    slot.id,
                    slot.creator_id,
                    slot.service_id,
                    slot.starts_at.isoformat(),
                    slot.ends_at.isoformat(),
                    int(slot.is_reserved),
                ),
            )
        return slot

    def reserve_slot(self, slot_id: str) -> AvailabilitySlot | None:
        slot = self.get_slot(slot_id)
        if slot is None:
            return None
        with self._connect() as connection:
            connection.execute(
                "UPDATE availability_slots SET is_reserved = 1 WHERE id = ?",
                (slot_id,),
            )
        return self.get_slot(slot_id)

    def create_user(self, user: User) -> User:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO users (
                    id, email, phone, role, status, is_age_verified, email_verified, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user.id,
                    user.email,
                    user.phone,
                    user.role,
                    user.status,
                    int(user.is_age_verified),
                    int(user.email_verified),
                    user.created_at.isoformat(),
                ),
            )
        return user

    def get_user_by_email(self, email: str) -> User | None:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM users WHERE LOWER(email) = LOWER(?)",
                (email,),
            ).fetchone()
        return self._to_user(row)

    def get_user(self, user_id: str) -> User | None:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM users WHERE id = ?",
                (user_id,),
            ).fetchone()
        return self._to_user(row)

    def create_session(self, session: Session) -> Session:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO sessions (id, user_id, token, created_at, expires_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    session.id,
                    session.user_id,
                    session.token,
                    session.created_at.isoformat(),
                    session.expires_at.isoformat(),
                ),
            )
        return session

    def get_user_by_token(self, token: str) -> User | None:
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT users.*
                FROM sessions
                JOIN users ON users.id = sessions.user_id
                WHERE sessions.token = ?
                ORDER BY sessions.created_at DESC
                LIMIT 1
                """,
                (token,),
            ).fetchone()
        return self._to_user(row)

    def create_booking(self, booking: Booking, actor_user_id: str) -> Booking:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO bookings (
                    id, buyer_id, creator_id, service_id, slot_id, status, scheduled_start,
                    scheduled_end, fulfillment_type, release_at, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    booking.id,
                    booking.buyer_id,
                    booking.creator_id,
                    booking.service_id,
                    booking.slot_id,
                    booking.status,
                    booking.scheduled_start.isoformat() if booking.scheduled_start else None,
                    booking.scheduled_end.isoformat() if booking.scheduled_end else None,
                    booking.fulfillment_type,
                    booking.release_at.isoformat() if booking.release_at else None,
                    booking.created_at.isoformat(),
                ),
            )
            connection.execute(
                """
                INSERT INTO booking_events (id, booking_id, event_type, actor_user_id, detail, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    BookingEvent(
                        booking_id=booking.id,
                        event_type="booking.created",
                        actor_user_id=actor_user_id,
                        detail=f"Booking created with status {booking.status}.",
                    ).id,
                    booking.id,
                    "booking.created",
                    actor_user_id,
                    f"Booking created with status {booking.status}.",
                    booking.created_at.isoformat(),
                ),
            )
        return booking

    def get_booking(self, booking_id: str) -> Booking | None:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM bookings WHERE id = ?",
                (booking_id,),
            ).fetchone()
        return self._to_booking(row)

    def list_booking_events(self, booking_id: str) -> list[BookingEvent]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT * FROM booking_events WHERE booking_id = ? ORDER BY created_at ASC",
                (booking_id,),
            ).fetchall()
        return [self._to_booking_event(row) for row in rows]

    def mark_booking_pending_payment(self, booking_id: str, actor_user_id: str) -> Booking | None:
        booking = self.get_booking(booking_id)
        if booking is None:
            return None

        with self._connect() as connection:
            connection.execute(
                "UPDATE bookings SET status = ? WHERE id = ?",
                ("pending_payment", booking_id),
            )
            event = BookingEvent(
                booking_id=booking_id,
                event_type="booking.pending_payment",
                actor_user_id=actor_user_id,
                detail="Booking moved into pending payment state.",
            )
            connection.execute(
                """
                INSERT INTO booking_events (id, booking_id, event_type, actor_user_id, detail, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    event.id,
                    event.booking_id,
                    event.event_type,
                    event.actor_user_id,
                    event.detail,
                    event.created_at.isoformat(),
                ),
            )
        return self.get_booking(booking_id)


repository = SQLiteRepository(settings.sqlite_path)
