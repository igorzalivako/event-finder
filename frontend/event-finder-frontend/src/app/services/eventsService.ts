import {
    getAllEvents,
    getEventById,
    getEventsByOrganizer,
    getUserRegisteredEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    registerForEvent,
    cancelEventRegistration
} from "../api/eventsApi";
import { EventEntity } from "../entities/event.types";
import { uploadEventImage } from "../api/eventsApi";

class EventsService {
    private currentUserId: string | null = null;

    setCurrentUserId(userId: string) {
        this.currentUserId = userId;
    }

    async getAllEvents(token: string): Promise<EventEntity[]> {
        try {
            return await getAllEvents(token);
        } catch (error) {
            console.error("Error fetching all events:", error);
            throw error;
        }
    }

    async getEventById(eventId: string, token: string): Promise<EventEntity> {
        try {
            return  await getEventById(eventId, token);
        } catch (error) {
            console.error("Error fetching event by id:", error);
            throw error;
        }
    }

    async getEventsByOrganizer(organizerId: string, token: string): Promise<EventEntity[]> {
        try {
            return  await getEventsByOrganizer(organizerId, token);
        } catch (error) {
            console.error("Error fetching events by organizer:", error);
            throw error;
        }
    }

    async getUserRegisteredEvents(token: string): Promise<EventEntity[]> {
        try {
            return await getUserRegisteredEvents(token);
        } catch (error) {
            console.error("Error fetching user registered events:", error);
            throw error;
        }
    }

    async createEvent(eventData: EventEntity, token: string): Promise<EventEntity> {
        try {
            return await createEvent(eventData, token);
        } catch (error) {
            console.error("Error creating event:", error);
            throw error;
        }
    }

    async updateEvent(eventId: string, eventData: EventEntity, token: string): Promise<EventEntity> {
        try {
            return await updateEvent(eventId, eventData, token);
        } catch (error) {
            console.error("Error updating event:", error);
            throw error;
        }
    }

    async deleteEvent(eventId: string, token: string): Promise<void> {
        try {
            await deleteEvent(eventId, token);
        } catch (error) {
            console.error("Error deleting event:", error);
            throw error;
        }
    }

    async registerForEvent(eventId: string, token: string): Promise<EventEntity> {
        try {
            return await registerForEvent(eventId, token);
        } catch (error) {
            console.error("Error registering for event:", error);
            throw error;
        }
    }

    async cancelEventRegistration(eventId: string, token: string): Promise<EventEntity> {
        try {
            return await cancelEventRegistration(eventId, token);
        } catch (error) {
            console.error("Error canceling event registration:", error);
            throw error;
        }
    }

    async uploadEventImages(eventId: string, images: File[], token: string): Promise<string[]> {
        try {
            const id = await uploadEventImage(eventId, images[0], token);
            return [id];
        } catch (error) {
            console.error("Error uploading event images:", error);
            throw error;
        }
    }
}

export const eventsService = new EventsService();