type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    level: LogLevel;
    message: string;
    context?: Record<string, any>;
    timestamp: string;
    url: string;
    userAgent: string;
}

class Logger {
    private static instance: Logger;
    private logs: LogEntry[] = [];
    private maxLogs = 100;

    private constructor() {
        // Set up global error handler
        window.addEventListener('error', (event) => {
            this.error('Uncaught error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
            });
        });

        // Set up unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.error('Unhandled promise rejection', {
                reason: event.reason,
                promise: event.promise,
            });
        });
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private log(level: LogLevel, message: string, context?: Record<string, any>) {
        const entry: LogEntry = {
            level,
            message,
            context,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
        };

        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Console output
        const consoleMethod = level === 'debug' ? 'log' : level;
        console[consoleMethod](`[${level.toUpperCase()}] ${message}`, context || '');
    }

    public debug(message: string, context?: Record<string, any>) {
        this.log('debug', message, context);
    }

    public info(message: string, context?: Record<string, any>) {
        this.log('info', message, context);
    }

    public warn(message: string, context?: Record<string, any>) {
        this.log('warn', message, context);
    }

    public error(message: string, context?: Record<string, any>) {
        this.log('error', message, context);
    }

    public getLogs(): LogEntry[] {
        return [...this.logs];
    }

    public clearLogs() {
        this.logs = [];
    }

    // Axios interceptor setup
    public setupAxiosInterceptors(axiosInstance: any) {
        // Request interceptor
        axiosInstance.interceptors.request.use(
            (config: any) => {
                this.debug('API Request', {
                    method: config.method?.toUpperCase(),
                    url: config.url,
                    data: config.data,
                    params: config.params,
                });
                return config;
            },
            (error: any) => {
                this.error('API Request Failed', {
                    message: error.message,
                    config: error.config,
                });
                return Promise.reject(error);
            }
        );

        // Response interceptor
        axiosInstance.interceptors.response.use(
            (response: any) => {
                this.debug('API Response', {
                    method: response.config.method?.toUpperCase(),
                    url: response.config.url,
                    status: response.status,
                    data: response.data,
                });
                return response;
            },
            (error: any) => {
                this.error('API Response Error', {
                    method: error.config?.method?.toUpperCase(),
                    url: error.config?.url,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    message: error.message,
                });
                return Promise.reject(error);
            }
        );
    }
}

export const logger = Logger.getInstance();
export default logger;
