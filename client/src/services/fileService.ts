
/**
 * @fileoverview File service for simulating server-side uploads.
 */

/**
 * Simulates uploading a file to a server.
 * In a real application, this would make a `fetch` request to a backend endpoint.
 * @param file The file to upload.
 * @returns A promise that resolves with an object containing the server URL of the uploaded file.
 */
export const uploadFile = (file: File): Promise<{ url: string }> => {
    return new Promise((resolve) => {
        // Simulate network delay to mimic a real upload process.
        setTimeout(() => {
            // For simulation, we create a server-relative path. A real backend would
            // store the file and return a permanent URL.
            const serverUrl = `/uploads/${Date.now()}-${file.name}`;
            console.log(`[Simulation] Uploaded ${file.name} to server path: ${serverUrl}`);
            resolve({ url: serverUrl });
        }, 300 + Math.random() * 500);
    });
};
