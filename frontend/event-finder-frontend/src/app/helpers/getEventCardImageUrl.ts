
///images/events/8b62200b-8e50-4b8d-8e17-26915199da80.jpg
//http://localhost:8080/api/v1.0/events/8b62200b-8e50-4b8d-8e17-26915199da80/image
import {SERVER_URL} from "../config/serverConfig";

export const getEventCardImageUrl = (id: string) => {
    // Формируем API URL
    return `${SERVER_URL}/api/v1.0/events/${id}/image`;
}