// Better Auth client for frontend
export const authClient = {
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",

    async getSession() {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/session`, {
                credentials: 'include',
            });
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Failed to get session:', error);
            return null;
        }
    },

    async signIn() {
        window.location.href = `${this.baseURL}/api/auth/signin/google`;
    },

    async signOut() {
        try {
            await fetch(`${this.baseURL}/api/auth/signout`, {
                method: 'POST',
                credentials: 'include',
            });
            window.location.href = '/';
        } catch (error) {
            console.error('Failed to sign out:', error);
        }
    }
};