import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { NetworkError } from '../errors';

export interface HttpClientConfig {
    baseURL: string;
    timeout?: number;
    retries?: number;
    headers?: Record<string, string>;
}

export class HttpClient {
    private client: AxiosInstance;
    private retries: number;

    constructor(config: HttpClientConfig) {
        this.retries = config.retries || 3;

        this.client = axios.create({
            baseURL: config.baseURL,
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': '@paylens/sdk',
                ...config.headers,
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors(): void {
        // Request interceptor for logging (in development)
        this.client.interceptors.request.use(
            (config) => {
                if (process.env.NODE_ENV === 'development') {
                    console.log(`[PayLens SDK] ${config.method?.toUpperCase()} ${config.url}`);
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response) {
                    // Server responded with error status
                    const { status, data } = error.response;
                    throw new NetworkError(
                        `HTTP ${status}: ${data?.message || error.message}`,
                        status,
                        data
                    );
                } else if (error.request) {
                    // Request was made but no response received
                    throw new NetworkError('No response received from server', undefined, undefined, error);
                } else {
                    // Something else happened
                    throw new NetworkError('Request setup failed', undefined, undefined, error);
                }
            }
        );
    }

    async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.executeWithRetry(() => this.client.get(url, config));
    }

    async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        return this.executeWithRetry(() => this.client.post(url, data, config));
    }

    async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        return this.executeWithRetry(() => this.client.put(url, data, config));
    }

    async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        return this.executeWithRetry(() => this.client.patch(url, data, config));
    }

    async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.executeWithRetry(() => this.client.delete(url, config));
    }

    private async executeWithRetry<T>(
        operation: () => Promise<AxiosResponse<T>>,
        attempt = 1
    ): Promise<T> {
        try {
            const response = await operation();
            return response.data;
        } catch (error) {
            if (attempt < this.retries && this.shouldRetry(error)) {
                const delay = this.calculateRetryDelay(attempt);
                await this.sleep(delay);
                return this.executeWithRetry(operation, attempt + 1);
            }
            throw error;
        }
    }

    private shouldRetry(error: unknown): boolean {
        if (error instanceof NetworkError) {
            // Retry on network errors and 5xx server errors
            return !error.statusCode || error.statusCode >= 500;
        }
        return false;
    }

    private calculateRetryDelay(attempt: number): number {
        // Exponential backoff: 1s, 2s, 4s, etc.
        return Math.min(1000 * Math.pow(2, attempt - 1), 10000);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Method to update headers (useful for authentication tokens)
    updateHeaders(headers: Record<string, string>): void {
        this.client.defaults.headers = {
            ...this.client.defaults.headers,
            ...headers,
        };
    }
}
