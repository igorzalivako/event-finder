import { getUserById, updateUser, deleteUser } from "../api/profileApi";
import {ProfileEntity} from "../entities/profile.types";



class ProfileService {
    private userId: string | null = null;
    private setUserName: ((newName: string) => void) | null = null;

    setUserId(userId: string) {
        this.userId = userId;
    }

    setSetterUserName(setter: (newName: string) => void) {
        this.setUserName = setter;
    };


    async getProfile(token: string): Promise<ProfileEntity> {
        if (!this.userId) {
            throw new Error("User ID not set");
        }

        try {
            return await getUserById(this.userId, token);
        } catch (error) {
            console.error("Error fetching profile:", error);
            throw error;
        }
    }

    async updateProfile(token: string, userData: ProfileEntity): Promise<ProfileEntity> {
        if (!this.userId) {
            throw new Error("User ID not set");
        }

        if (userData.userName)
            this.setUserName(userData.userName);

        try {
            return await updateUser(this.userId, userData, token);
        } catch (error) {
            console.error("Error updating profile:", error);
            throw error;
        }
    }

    async deleteProfile(token: string, password: string): Promise<void> {
        if (!this.userId) {
            throw new Error("User ID not set");
        }

        try {
            await deleteUser(this.userId, token, password);
        } catch (error) {
            console.error("Error deleting profile:", error);
            throw error;
        }
    }
}

export const profileService = new ProfileService();