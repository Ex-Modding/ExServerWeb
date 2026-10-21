declare module "exaroton" {
  export const ServerStatus: {
    OFFLINE: number;
    ONLINE: number;
    STARTING: number;
    STOPPING: number;
    RESTARTING: number;
    SAVING: number;
    LOADING: number;
    CRASHED: number;
    PENDING: number;
    TRANSFERRING: number;
    PREPARING: number;
  };

  export interface ServerPlayers {
    count: number;
    max: number;
    list: string[];
  }

  export interface ServerSoftware {
    name: string;
    version: string;
  }

  export class Server {
    id: string;
    name: string;
    address: string;
    motd: string;
    status: number;
    host: string | null;
    port: number | null;
    shared: boolean;
    software?: ServerSoftware;
    players?: ServerPlayers;

    get(): Promise<this>;
    start(useOwnCredits?: boolean): Promise<unknown>;
    stop(): Promise<unknown>;
    restart(): Promise<unknown>;
    executeCommand(command: string): Promise<unknown>;
    getRAM(): Promise<number>;
  }

  export class Client {
    constructor(apiToken: string);
    server(id: string): Server;
  }
}
