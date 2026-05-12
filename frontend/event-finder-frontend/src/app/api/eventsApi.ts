import { SERVER_URL } from "../config/serverConfig";
import { EventEntity } from "../entities/event.types";
import { getUserById } from "../api/profileApi";
import { ProfileEntity } from "../entities/profile.types";

// Вспомогательная функция для обогащения событий данными организатора
async function enrichEventsWithOrganizerData(events: EventEntity[], token: string): Promise<EventEntity[]> {
    const organizerIds = [...new Set(events.map(event => event.organizerId))];
    const organizerProfiles = new Map<string, ProfileEntity>();

    await Promise.all(
        organizerIds.map(async (organizerId) => {
            try {
                const profile = await getUserById(organizerId, token);
                organizerProfiles.set(organizerId, profile);
            } catch (error) {
                console.error(`Failed to fetch organizer ${organizerId}:`, error);
            }
        })
    );

    // Обогащаем события данными организатора
    return events.map(event => {
        const organizer = organizerProfiles.get(event.organizerId);
        if (organizer) {
            return {
                ...event,
                organizerName: organizer.userName || organizer.alias || "Организатор",
                organizerAvatar: organizer.avatarUrl || event.organizerAvatar,
            };
        }
        return event;
    });
}

// GET /api/events - Получить список всех событий
export async function getAllEvents(token: string): Promise<EventEntity[]> {
    const response = await fetch(`${SERVER_URL}/api/v1.0/events`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const error = new Error(`${response.status}`);
        // @ts-ignore
        error.status = response.status;
        throw error;
    }

    const events: EventEntity[] = await response.json();

    console.log("Got events: ", events);

    // Обогащаем события данными организаторов
    return await enrichEventsWithOrganizerData(events, token);
}

// GET /api/events/{id} - Получить событие по ID
export async function getEventById(eventId: string, token: string): Promise<EventEntity> {
    const response = await fetch(`${SERVER_URL}/api/v1.0/events/${eventId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const error = new Error(`${response.status}`);
        // @ts-ignore
        error.status = response.status;
        throw error;
    }

    const event: EventEntity = await response.json();

    // Запрашиваем данные организатора
    try {
        const organizer = await getUserById(event.organizerId, token);
        return {
            ...event,
            organizerName: organizer.userName || organizer.alias || "Организатор",
            organizerAvatar: organizer.avatarUrl || event.organizerAvatar,
        };
    } catch (error) {
        console.error("Failed to fetch organizer:", error);
        return event;
    }
}

// GET /api/events/organizer/{organizerId} - Получить события организатора
export async function getEventsByOrganizer(organizerId: string, token: string): Promise<EventEntity[]> {
    const response = await fetch(`${SERVER_URL}/api/v1.0/events/organizer/${organizerId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const error = new Error(`${response.status}`);
        // @ts-ignore
        error.status = response.status;
        throw error;
    }

    const events: EventEntity[] = await response.json();

    // Для этого случая запрашиваем только одного организатора (владельца событий)
    try {
        const organizer = await getUserById(organizerId, token);
        return events.map(event => ({
            ...event,
            organizerName: organizer.userName || organizer.alias || event.organizerName || "Организатор",
            organizerAvatar: organizer.avatarUrl || event.organizerAvatar,
        }));
    } catch (error) {
        console.error("Failed to fetch organizer:", error);
        return events;
    }
}

// GET /api/events/user/registered - Получить события, на которые пользователь записан
export async function getUserRegisteredEvents(token: string): Promise<EventEntity[]> {
    const response = await fetch(`${SERVER_URL}/api/v1.0/events/user/registered`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const error = new Error(`${response.status}`);
        // @ts-ignore
        error.status = response.status;
        throw error;
    }

    const events: EventEntity[] = await response.json();

    // Обогащаем события данными организаторов
    return await enrichEventsWithOrganizerData(events, token);
}

// POST /api/events - Создать новое событие
export async function createEvent(eventData: EventEntity, token: string): Promise<EventEntity> {
    const response = await fetch(`${SERVER_URL}/api/v1.0/events`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
    });

    if (!response.ok) {
        const error = new Error(`${response.status}`);
        // @ts-ignore
        error.status = response.status;
        throw error;
    }

    const event: EventEntity = await response.json();

    // У созданного события organizerName уже должен быть правильным,
    // так как мы передаем его при создании, но на всякий случай запросим профиль
    try {
        const organizer = await getUserById(event.organizerId, token);
        return {
            ...event,
            organizerName: organizer.userName || organizer.alias || event.organizerName,
            organizerAvatar: organizer.avatarUrl || event.organizerAvatar,
        };
    } catch (error) {
        console.error("Failed to fetch organizer for created event:", error);
        return event;
    }
}

// PUT /api/events/{id} - Обновить событие
export async function updateEvent(eventId: string, eventData: EventEntity, token: string): Promise<EventEntity> {
    const response = await fetch(`${SERVER_URL}/api/v1.0/events/${eventId}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
    });

    if (!response.ok) {
        const error = new Error(`${response.status}`);
        // @ts-ignore
        error.status = response.status;
        throw error;
    }

    const event: EventEntity = await response.json();

    // Обновляем данные организатора
    try {
        const organizer = await getUserById(event.organizerId, token);
        return {
            ...event,
            organizerName: organizer.userName || organizer.alias || event.organizerName,
            organizerAvatar: organizer.avatarUrl || event.organizerAvatar,
        };
    } catch (error) {
        console.error("Failed to fetch organizer for updated event:", error);
        return event;
    }
}

// DELETE /api/events/{id} - Удалить событие
export async function deleteEvent(eventId: string, token: string): Promise<void> {
    const response = await fetch(`${SERVER_URL}/api/v1.0/events/${eventId}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const error = new Error(`${response.status}`);
        // @ts-ignore
        error.status = response.status;
        throw error;
    }
}

export async function registerForEvent(eventId: string, token: string): Promise<EventEntity> {
    const response = await fetch(`${SERVER_URL}/api/v1.0/events/${eventId}/register`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const error = new Error(`${response.status}`);
        // @ts-ignore
        error.status = response.status;
        throw error;
    }

    const updatedEvent = await response.json();
    console.log("Register response - updated event:", updatedEvent);
    console.log("Available spots after register:", updatedEvent.availableSpots);

    return updatedEvent;
}

export async function cancelEventRegistration(eventId: string, token: string): Promise<EventEntity> {
    const response = await fetch(`${SERVER_URL}/api/v1.0/events/${eventId}/register`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const error = new Error(`${response.status}`);
        // @ts-ignore
        error.status = response.status;
        throw error;
    }

    const updatedEvent = await response.json();
    console.log("Cancel response - updated event:", updatedEvent);
    console.log("Available spots after cancel:", updatedEvent.availableSpots);

    return updatedEvent;
}

// POST /api/events/{id}/images - Загрузить изображения мероприятия
/*
export async function uploadEventImages(eventId: string, images: File[], token: string): Promise<string[]> {
    const formData = new FormData();

    images.forEach((image) => {
        formData.append('images', image);
    });

    const response = await fetch(`${SERVER_URL}/api/v1.0/events/${eventId}/images`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = new Error(`${response.status}`);
        // @ts-ignore
        error.status = response.status;
        throw error;
    }

    return await response.json();
}*/

export async function uploadEventImage(eventId: string, image: File, token: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', image); // Поле должно называться 'file', как в бэкенде

    const response = await fetch(`${SERVER_URL}/api/v1.0/events/${eventId}/image`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = new Error(`${response.status}`);
        // @ts-ignore
        error.status = response.status;
        throw error;
    }

    const eventDto = await response.json();
    return eventDto.id; // или вернуть весь eventDto
}